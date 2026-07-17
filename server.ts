import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { LinkItem } from "./src/types";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Path to link storage
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "links.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default links seed
const DEFAULT_LINKS: LinkItem[] = [
  {
    id: "seed-1",
    title: "M10 Wireless Bluetooth Earbuds",
    url: "https://www.daraz.com.bd/products/m10-tws-wireless-earbuds-i181160124.html",
    description: "কম বাজেটের মধ্যে চমৎকার সাউন্ড কোয়ালিটি এবং দীর্ঘস্থায়ী ব্যাটারি লাইফ সম্পন্ন জনপ্রিয় ব্লুটুথ ইয়ারবাডস। ডাবল এলইডি ডিসপ্লে এবং পাওয়ার ব্যাংক সুবিধা সহ।",
    type: "product",
    price: "৳ ৩৫০",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "Electronics",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-2",
    title: "T900 Ultra Smart Watch",
    url: "https://www.daraz.com.bd/products/t900-ultra-smart-watch-i274941913.html",
    description: "আকর্ষণীয় বড় স্ক্রিন ডিসপ্লে, কলিং এবং নোটিফিকেশন রিসিভার স্পেশাল ফিটনেস ট্র্যাকিং ফিচার সমৃদ্ধ স্টাইলিশ স্মার্ট ওয়াচ।",
    type: "product",
    price: "৳ ৮৫০",
    imageUrl: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "Gadgets",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-3",
    title: "RGB Mechanical Keyboard",
    url: "https://www.daraz.com.bd/products/mechanical-keyboard-i228190300.html",
    description: "দারুন টাইপিং এক্সপেরিয়েন্স এবং কাস্টমাইজড আরজিবি ব্যাকলিট মোড সহ আল্ট্রা-রেসপনসিভ মেকানিক্যাল কীবোর্ড। গেমার এবং প্রোগ্রামারদের প্রথম পছন্দ।",
    type: "product",
    price: "৳ ১,৮৫০",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "Accessories",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-4",
    title: "Ruhul Bangla Note App",
    url: "https://ais-pre-4lfmo4yhrjw4holptuvfva-355770538193.asia-southeast1.run.app",
    description: "সহজে যেকোনো নোট বাংলায় লিখতে ও সেভ করতে আমার তৈরি করা একটি ক্লাউড-সংরক্ষিত আধুনিক নোটপ্যাড অ্যাপ্লিকেশন।",
    type: "app",
    category: "Utility",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-5",
    title: "Bangla Word Puzzle Game",
    url: "https://ais-pre-4lfmo4yhrjw4holptuvfva-355770538193.asia-southeast1.run.app/puzzle",
    description: "বাংলা শব্দ নিয়ে মজার কুইজ এবং বুদ্ধিমত্তা যাচাইয়ের চমৎকার গেম। শব্দ তৈরি করুন আর স্কোর বাড়িয়ে লিডারবোর্ডে জায়গা করে নিন!",
    type: "app",
    category: "Gaming",
    createdAt: new Date().toISOString()
  }
];

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_LINKS, null, 2), "utf-8");
}

// In-memory active admin sessions
const activeSessions = new Set<string>();

// In-memory active general user sessions: Map<token, { username, name }>
const activeUserSessions = new Map<string, { username: string; name: string }>();

// Middleware to parse JSON bodies
app.use(express.json());

// Helper to load links
function loadLinks(): LinkItem[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading links data file:", err);
  }
  return DEFAULT_LINKS;
}

// Helper to save links
function saveLinks(links: LinkItem[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(links, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving links data file:", err);
  }
}

// Helper to load registered users
function loadUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading users data file:", err);
  }
  return [];
}

// Helper to save registered users
function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving users data file:", err);
  }
}

// Admin only Auth Middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "অননুমোদিত অ্যাক্সেস! টোকেন দেওয়া হয়নি।" });
    return;
  }
  const token = authHeader.split(" ")[1];
  if (!activeSessions.has(token)) {
    res.status(401).json({ error: "অকার্যকর বা মেয়াদোত্তীর্ণ টোকেন! আবার লগইন করুন।" });
    return;
  }
  next();
}

// General Auth Middleware (Admin OR User)
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "অননুমোদিত অ্যাক্সেস! টোকেন দেওয়া হয়নি।" });
    return;
  }
  const token = authHeader.split(" ")[1];
  if (activeSessions.has(token) || activeUserSessions.has(token)) {
    next();
  } else {
    res.status(401).json({ error: "অকার্যকর বা মেয়াদোত্তীর্ণ টোকেন! আবার লগইন করুন।" });
  }
}

// API Routes

// Admin Login - check password server-side securely
app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  
  // Strict, server-side-only password verification
  if (password === (process.env.ADMIN_PASSWORD || "Ruhul@763")) {
    // Generate a secure random token
    const token = "adm-" + crypto.randomBytes(32).toString("hex");
    activeSessions.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: "ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিন।" });
  }
});

// General User Registration (Sign up)
app.post("/api/auth/register", (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    res.status(400).json({ error: "সবগুলো ফিল্ড পূরণ করা আবশ্যক।" });
    return;
  }
  
  const users = loadUsers();
  const normalizedUsername = username.trim().toLowerCase();
  
  const existingUser = users.find(u => u.username === normalizedUsername);
  if (existingUser) {
    res.status(400).json({ error: "এই ইউজারনেমটি ইতিমধ্যেই ব্যবহার করা হয়েছে।" });
    return;
  }
  
  const newUser = {
    id: "user-" + Date.now() + "-" + crypto.randomInt(1000, 9999),
    name: name.trim(),
    username: normalizedUsername,
    password, // Stored simply for this custom portal
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Auto login after sign up
  const token = "usr-" + crypto.randomBytes(32).toString("hex");
  activeUserSessions.set(token, { username: newUser.username, name: newUser.name });
  
  res.status(201).json({ success: true, token, user: { name: newUser.name, username: newUser.username } });
});

// General User Login
app.post("/api/auth/login-user", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।" });
    return;
  }
  
  const users = loadUsers();
  const normalizedUsername = username.trim().toLowerCase();
  
  const user = users.find(u => u.username === normalizedUsername && u.password === password);
  if (user) {
    const token = "usr-" + crypto.randomBytes(32).toString("hex");
    activeUserSessions.set(token, { username: user.username, name: user.name });
    res.json({ success: true, token, user: { name: user.name, username: user.username } });
  } else {
    res.status(401).json({ error: "ইউজারনেম অথবা পাসওয়ার্ড ভুল!" });
  }
});

// Logout (Deletes both admin and general user sessions)
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    activeSessions.delete(token);
    activeUserSessions.delete(token);
  }
  res.json({ success: true });
});

// Verify Admin Session Status
app.get("/api/auth/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (activeSessions.has(token)) {
      res.json({ valid: true });
      return;
    }
  }
  res.json({ valid: false });
});

// Verify General User Session Status
app.get("/api/auth/verify-user", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (activeUserSessions.has(token)) {
      const user = activeUserSessions.get(token);
      res.json({ valid: true, user });
      return;
    }
  }
  res.json({ valid: false });
});

// Get all links (Requires user or admin auth)
app.get("/api/links", requireAuth, (req, res) => {
  const links = loadLinks();
  res.json(links);
});

// Create a new link (Protected)
app.post("/api/links", requireAdmin, (req, res) => {
  const { title, url, description, type, price, imageUrl, category, platform } = req.body;
  
  if (!title || !url || !type) {
    res.status(400).json({ error: "শিরোনাম, লিংক এবং ধরণ প্রদান করা আবশ্যক।" });
    return;
  }
  
  const links = loadLinks();
  const newLink: LinkItem = {
    id: "link-" + Date.now() + "-" + crypto.randomInt(1000, 9999),
    title,
    url,
    description: description || "",
    type,
    price: type === "product" ? price || "" : undefined,
    imageUrl: type === "product" ? imageUrl || "" : undefined,
    category: category || "Other",
    platform: type === "product" ? platform || "daraz" : undefined,
    createdAt: new Date().toISOString()
  };
  
  links.unshift(newLink); // Add to the top
  saveLinks(links);
  res.status(201).json(newLink);
});

// Update an existing link (Protected)
app.put("/api/links/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, url, description, type, price, imageUrl, category, platform } = req.body;
  
  const links = loadLinks();
  const index = links.findIndex(l => l.id === id);
  
  if (index === -1) {
    res.status(404).json({ error: "লিংকটি পাওয়া যায়নি।" });
    return;
  }
  
  links[index] = {
    ...links[index],
    title: title || links[index].title,
    url: url || links[index].url,
    description: description !== undefined ? description : links[index].description,
    type: type || links[index].type,
    price: type === "product" ? price || "" : undefined,
    imageUrl: type === "product" ? imageUrl || "" : undefined,
    category: category || links[index].category,
    platform: type === "product" ? platform || links[index].platform || "daraz" : undefined
  };
  
  saveLinks(links);
  res.json(links[index]);
});

// Delete a link (Protected)
app.delete("/api/links/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const links = loadLinks();
  const filtered = links.filter(l => l.id !== id);
  
  if (links.length === filtered.length) {
    res.status(404).json({ error: "লিংকটি পাওয়া যায়নি।" });
    return;
  }
  
  saveLinks(filtered);
  res.json({ success: true, message: "লিংকটি সফলভাবে মুছে ফেলা হয়েছে।" });
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // In development mode, load Vite server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve compiled files from 'dist'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start the server:", err);
});
