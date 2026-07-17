import React, { useState, useEffect } from "react";
import { 
  Search, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Plus, 
  Edit2, 
  Trash2, 
  LogOut, 
  ShoppingBag, 
  Globe, 
  X, 
  AlertCircle, 
  CheckCircle,
  Tag,
  Calendar,
  Sparkles,
  RefreshCw,
  FolderPlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LinkItem } from "./types";

export default function App() {
  // State variables
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"all" | "product" | "app">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");

  // General User authentication state
  const [isUser, setIsUser] = useState<boolean>(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; username: string } | null>(null);
  
  // Custom Registration / Login screen portal
  const [authPortalMode, setAuthPortalMode] = useState<"login" | "signup" | "admin">("login");
  const [regName, setRegName] = useState<string>("");
  const [regUsername, setRegUsername] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [portalError, setPortalError] = useState<string>("");
  const [portalLoading, setPortalLoading] = useState<boolean>(false);

  // Admin CRUD Form Modal state
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formUrl, setFormUrl] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formType, setFormType] = useState<"product" | "app">("product");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formImageUrl, setFormImageUrl] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formPlatform, setFormPlatform] = useState<string>("daraz");
  const [customPlatform, setCustomPlatform] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Delete Confirm Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  // Load link items and check auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Fetch all links from API
  const fetchLinks = async (tokenToUse?: string) => {
    setLoading(true);
    const token = tokenToUse || adminToken || userToken || localStorage.getItem("ruhul_web_token") || localStorage.getItem("ruhul_user_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/links", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      } else if (res.status === 401) {
        // Clear stale tokens
        localStorage.removeItem("ruhul_web_token");
        localStorage.removeItem("ruhul_user_token");
        localStorage.removeItem("ruhul_user_profile");
        setIsAdmin(false);
        setIsUser(false);
        setAdminToken(null);
        setUserToken(null);
        setUserProfile(null);
      } else {
        setErrorMessage("লিংক তালিকা লোড করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      setErrorMessage("সার্ভারের সাথে সংযোগ করা যাচ্ছে না।");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check if saved token is still valid
  const checkAuthStatus = async () => {
    const adminSavedToken = localStorage.getItem("ruhul_web_token");
    const userSavedToken = localStorage.getItem("ruhul_user_token");

    if (adminSavedToken) {
      try {
        const res = await fetch("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${adminSavedToken}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setIsAdmin(true);
          setAdminToken(adminSavedToken);
          fetchLinks(adminSavedToken);
          return;
        } else {
          localStorage.removeItem("ruhul_web_token");
        }
      } catch (err) {
        console.error("Admin verification failed:", err);
      }
    }

    if (userSavedToken) {
      try {
        const res = await fetch("/api/auth/verify-user", {
          headers: {
            Authorization: `Bearer ${userSavedToken}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          setIsUser(true);
          setUserToken(userSavedToken);
          setUserProfile(data.user);
          fetchLinks(userSavedToken);
          return;
        } else {
          localStorage.removeItem("ruhul_user_token");
          localStorage.removeItem("ruhul_user_profile");
        }
      } catch (err) {
        console.error("User verification failed:", err);
      }
    }

    setLoading(false); // Done checking, neither logged in -> will show gate
  };

  // Trigger brief alert messages
  const showNotification = (msg: string, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(""), 4000);
    } else {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  // Handle General User Login
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword) {
      setPortalError("ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন!");
      return;
    }
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await fetch("/api/auth/login-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername, password: regPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("ruhul_user_token", data.token);
        localStorage.setItem("ruhul_user_profile", JSON.stringify(data.user));
        setIsUser(true);
        setUserToken(data.token);
        setUserProfile(data.user);
        setRegUsername("");
        setRegPassword("");
        showNotification(`${data.user.name}, আপনাকে স্বাগতম!`);
        fetchLinks(data.token);
      } else {
        setPortalError(data.error || "ইউজারনেম অথবা পাসওয়ার্ড ভুল!");
      }
    } catch (err) {
      setPortalError("সার্ভারের সাথে যোগাযোগ করা যায়নি।");
      console.error(err);
    } finally {
      setPortalLoading(false);
    }
  };

  // Handle General User Registration (Sign up)
  const handleUserSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regUsername || !regPassword) {
      setPortalError("সবগুলো ফিল্ড পূরণ করুন!");
      return;
    }
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, username: regUsername, password: regPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("ruhul_user_token", data.token);
        localStorage.setItem("ruhul_user_profile", JSON.stringify(data.user));
        setIsUser(true);
        setUserToken(data.token);
        setUserProfile(data.user);
        setRegName("");
        setRegUsername("");
        setRegPassword("");
        showNotification("অ্যাকাউন্ট তৈরি সফল হয়েছে! স্বাগতম।");
        fetchLinks(data.token);
      } else {
        setPortalError(data.error || "ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে বা অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে।");
      }
    } catch (err) {
      setPortalError("সার্ভারের সাথে যোগাযোগ করা যায়নি।");
      console.error(err);
    } finally {
      setPortalLoading(false);
    }
  };

  // Handle Admin Portal Login
  const handlePortalAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPassword) {
      setPortalError("অ্যাডমিন পাসওয়ার্ড প্রদান করুন!");
      return;
    }
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: regPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem("ruhul_web_token", data.token);
        setIsAdmin(true);
        setAdminToken(data.token);
        setRegPassword("");
        showNotification("সফলভাবে অ্যাডমিন মোডে লগইন করা হয়েছে।");
        fetchLinks(data.token);
      } else {
        setPortalError(data.error || "পাসওয়ার্ড সঠিক নয়!");
      }
    } catch (err) {
      setPortalError("সার্ভারের সাথে যোগাযোগ করা যায়নি।");
      console.error(err);
    } finally {
      setPortalLoading(false);
    }
  };

  // Handle Unified Logout
  const handleLogout = async () => {
    const token = adminToken || userToken || localStorage.getItem("ruhul_web_token") || localStorage.getItem("ruhul_user_token");
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Logout request failed:", err);
      }
    }
    localStorage.removeItem("ruhul_web_token");
    localStorage.removeItem("ruhul_user_token");
    localStorage.removeItem("ruhul_user_profile");
    setIsAdmin(false);
    setIsUser(false);
    setAdminToken(null);
    setUserToken(null);
    setUserProfile(null);
    showNotification("সফলভাবে লগআউট করা হয়েছে।");
  };

  // Open Form to Add Link
  const openAddModal = () => {
    setFormMode("add");
    setEditingLinkId(null);
    setFormTitle("");
    setFormUrl("");
    setFormDescription("");
    setFormType("product");
    setFormPrice("");
    setFormImageUrl("");
    setFormCategory("Electronics");
    setFormPlatform("daraz");
    setCustomPlatform("");
    setFormError("");
    setShowFormModal(true);
  };

  // Open Form to Edit Link
  const openEditModal = (link: LinkItem) => {
    setFormMode("edit");
    setEditingLinkId(link.id);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormDescription(link.description);
    setFormType(link.type);
    setFormPrice(link.price || "");
    setFormImageUrl(link.imageUrl || "");
    setFormCategory(link.category || "Other");
    
    const plat = link.platform || "daraz";
    if (["daraz", "amazon", "aliexpress"].includes(plat.toLowerCase())) {
      setFormPlatform(plat.toLowerCase());
      setCustomPlatform("");
    } else {
      setFormPlatform("other");
      setCustomPlatform(plat);
    }
    
    setFormError("");
    setShowFormModal(true);
  };

  // Handle Add/Edit Form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formUrl) {
      setFormError("শিরোনাম এবং লিংক অবশ্যই দিতে হবে।");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    const payload = {
      title: formTitle,
      url: formUrl,
      description: formDescription,
      type: formType,
      price: formType === "product" ? formPrice : undefined,
      imageUrl: formType === "product" ? formImageUrl : undefined,
      category: formCategory,
      platform: formType === "product" ? (formPlatform === "other" ? customPlatform : formPlatform) : undefined,
    };

    try {
      const url = formMode === "add" ? "/api/links" : `/api/links/${editingLinkId}`;
      const method = formMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setShowFormModal(false);
        fetchLinks();
        showNotification(
          formMode === "add" 
            ? "নতুন লিংকটি সফলভাবে যুক্ত করা হয়েছে!" 
            : "লিংকটি সফলভাবে আপডেট করা হয়েছে!"
        );
      } else {
        setFormError(data.error || "কার্যক্রমটি ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      setFormError("সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Trigger Delete confirmation
  const confirmDelete = (id: string) => {
    setDeletingLinkId(id);
    setShowDeleteConfirm(true);
  };

  // Handle Delete execution
  const handleDeleteLink = async () => {
    if (!deletingLinkId) return;
    setDeleteSubmitting(true);

    try {
      const res = await fetch(`/api/links/${deletingLinkId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        setDeletingLinkId(null);
        fetchLinks();
        showNotification("লিংকটি সফলভাবে মুছে ফেলা হয়েছে।", true);
      } else {
        const data = await res.json();
        showNotification(data.error || "মুছে ফেলা সম্ভব হয়নি।", false);
      }
    } catch (err) {
      showNotification("সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।", false);
      console.error(err);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Get unique categories for filters based on selected type
  const getCategories = () => {
    const relevantLinks = selectedType === "all" 
      ? links 
      : links.filter(l => l.type === selectedType);
    
    const cats = relevantLinks.map(l => l.category || "Other");
    return ["all", ...Array.from(new Set(cats))];
  };

  // Filter links based on Search & Tabs
  const filteredLinks = links.filter((link) => {
    // Type Filter
    if (selectedType !== "all" && link.type !== selectedType) return false;
    
    // Category Filter
    if (selectedCategory !== "all" && link.category !== selectedCategory) return false;

    // Search Term Filter (checks title, description, and category)
    const matchStr = `${link.title} ${link.description} ${link.category}`.toLowerCase();
    return matchStr.includes(searchTerm.toLowerCase());
  });

  const filteredProducts = filteredLinks.filter((link) => link.type === "product");
  const filteredApps = filteredLinks.filter((link) => link.type === "app");

  // Helper function to get platform-specific styling and copy for affiliate products
  const getPlatformInfo = (link: LinkItem) => {
    // Guess platform from URL if not specified
    let platformKey = (link.platform || "").toLowerCase().trim();
    if (!platformKey) {
      const url = link.url.toLowerCase();
      if (url.includes("daraz")) {
        platformKey = "daraz";
      } else if (url.includes("amazon")) {
        platformKey = "amazon";
      } else if (url.includes("aliexpress")) {
        platformKey = "aliexpress";
      } else {
        platformKey = "other";
      }
    }

    switch (platformKey) {
      case "daraz":
        return {
          name: "Daraz",
          badgeText: "DARAZ",
          buttonText: "দারাজ-এ কিনুন",
          badgeClass: "text-orange-400 border-orange-500/20 bg-orange-950/40",
          btnClass: "bg-orange-600/10 text-orange-500 border-orange-600/20 hover:bg-orange-600 hover:text-white hover:border-orange-600 hover:shadow-lg hover:shadow-orange-500/10",
          hoverBorder: "hover:border-orange-500/50"
        };
      case "amazon":
        return {
          name: "Amazon",
          badgeText: "AMAZON",
          buttonText: "অ্যামাজন-এ কিনুন",
          badgeClass: "text-amber-400 border-amber-500/20 bg-amber-950/40",
          btnClass: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10",
          hoverBorder: "hover:border-amber-500/50"
        };
      case "aliexpress":
        return {
          name: "AliExpress",
          badgeText: "ALIEXPRESS",
          buttonText: "আলীএক্সপ্রেস-এ কিনুন",
          badgeClass: "text-rose-400 border-rose-500/20 bg-rose-950/40",
          btnClass: "bg-rose-600/10 text-rose-500 border-rose-600/20 hover:bg-rose-600 hover:text-white hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/10",
          hoverBorder: "hover:border-rose-500/50"
        };
      default:
        const customName = link.platform || "Affiliate";
        return {
          name: customName,
          badgeText: customName.toUpperCase(),
          buttonText: "অনলাইনে কিনুন",
          badgeClass: "text-cyan-400 border-cyan-500/20 bg-cyan-950/40",
          btnClass: "bg-cyan-600/10 text-cyan-500 border-cyan-600/20 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 hover:shadow-lg hover:shadow-cyan-500/10",
          hoverBorder: "hover:border-cyan-500/50"
        };
    }
  };

  // Helper renderer for Product Cards
  const renderProductCard = (link: LinkItem) => {
    const platformInfo = getPlatformInfo(link);
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        key={link.id}
        className={`group bg-[#0F1117] hover:bg-[#13161F] border border-slate-800 ${platformInfo.hoverBorder} rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300 relative hover:-translate-y-1 shadow-slate-950/20`}
      >
        <div>
          {/* Visual Media Header (for Products) */}
          <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-slate-950 relative border border-slate-800/50">
            {link.imageUrl ? (
              <img 
                src={link.imageUrl} 
                alt={link.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                <span className="text-xs">কোনো ছবি নেই</span>
              </div>
            )}
            {/* Price Tag Overlay */}
            {link.price && (
              <div className="absolute bottom-3 right-3 bg-slate-950/90 text-white font-extrabold px-3 py-1.5 rounded-lg text-sm shadow-md flex items-center border border-slate-850">
                {link.price}
              </div>
            )}
            {/* Source Tag Badge */}
            <div className={`absolute top-3 left-3 font-bold px-2.5 py-0.5 rounded-md text-[10px] tracking-wider border ${platformInfo.badgeClass}`}>
              {platformInfo.badgeText}
            </div>
          </div>

          {/* Meta Section */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#0A0C10] border border-slate-800 text-slate-300 rounded-md">
              {link.category || "General"}
            </span>
            <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3" />
              <span>{new Date(link.createdAt).toLocaleDateString("bn-BD")}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-indigo-400 transition-colors">
            {link.title}
          </h3>

          {/* Description */}
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4">
            {link.description || "কোনো অতিরিক্ত বিবরণ দেওয়া হয়নি।"}
          </p>
        </div>

        {/* Actions Area */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex items-center justify-between gap-3">
          {/* Visitor Link Redirect Button */}
          <a 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider border transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${platformInfo.btnClass}`}
          >
            <span>{platformInfo.buttonText}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Admin Actions Overlay inside each card */}
          {isAdmin && (
            <div className="flex gap-1">
              <button 
                onClick={() => openEditModal(link)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 p-2 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer"
                title="সম্পাদনা করুন"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => confirmDelete(link.id)}
                className="bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 p-2 rounded-xl border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Helper renderer for App Cards
  const renderAppCard = (link: LinkItem) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      key={link.id}
      className="group bg-[#0F1117] hover:bg-[#13161F] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300 relative hover:-translate-y-1 shadow-slate-950/20"
    >
      <div>
        {/* App Visual Header (Minimal Icon Header) */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 font-extrabold shadow-inner group-hover:bg-indigo-600/30 group-hover:text-indigo-300 transition-colors shrink-0">
            RW
          </div>
          <div>
            <span className="bg-indigo-500/10 text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-indigo-500/20">
              PROPRIETARY APP
            </span>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3" />
              <span>{new Date(link.createdAt).toLocaleDateString("bn-BD")}</span>
            </div>
          </div>
        </div>

        {/* Meta Section */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold px-2.5 py-0.5 bg-[#0A0C10] border border-slate-800 text-indigo-400 rounded-md">
            {link.category || "Application"}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-indigo-400 transition-colors">
          {link.title}
        </h3>

        {/* Description */}
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4">
          {link.description || "কোনো অতিরিক্ত বিবরণ দেওয়া হয়নি।"}
        </p>
      </div>

      {/* Actions Area */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex items-center justify-between gap-3">
        {/* Visitor Link Redirect Button */}
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex-1 bg-indigo-600/10 text-indigo-400 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>অ্যাপে প্রবেশ করুন</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Admin Actions Overlay inside each card */}
        {isAdmin && (
          <div className="flex gap-1">
            <button 
              onClick={() => openEditModal(link)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 p-2 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer"
              title="সম্পাদনা করুন"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => confirmDelete(link.id)}
              className="bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 p-2 rounded-xl border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
              title="মুছে ফেলুন"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex flex-col items-center justify-center text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-sm font-medium text-slate-400">লোডিং হচ্ছে...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isUser) {
    // Show Authentication Portal
    return (
      <div className="min-h-screen bg-[#0A0C10] text-slate-200 font-sans relative overflow-hidden flex items-center justify-center px-4 py-12 selection:bg-indigo-500 selection:text-slate-900">
        {/* Background Decorative Grids and Spots */}
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))]" />
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-[50%] right-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#0F1117]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
        >
          {/* Logo and Greeting */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-500/20 text-white mx-auto mb-4 tracking-wider">
              RW
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-wider mb-2">
              রুহুল ওয়েব <span className="text-indigo-400 font-medium">লিংক হাব</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              আমাদের এক্সক্লুসিভ লিংক ডিরেক্টরি এবং অফারগুলো দেখতে অনুগ্রহ করে লগইন বা রেজিস্ট্রেশন করুন।
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex bg-[#0A0C10] p-1.5 rounded-xl border border-slate-800 mb-6 gap-1">
            <button
              onClick={() => {
                setAuthPortalMode("login");
                setPortalError("");
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                authPortalMode === "login"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              লগইন করুন
            </button>
            <button
              onClick={() => {
                setAuthPortalMode("signup");
                setPortalError("");
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                authPortalMode === "signup"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              নতুন অ্যাকাউন্ট
            </button>
            <button
              onClick={() => {
                setAuthPortalMode("admin");
                setPortalError("");
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                authPortalMode === "admin"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              অ্যাডমিন পোর্টাল
            </button>
          </div>

          {portalError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2 mb-4 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{portalError}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {authPortalMode === "login" && (
            <form onSubmit={handleUserLogin} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">ইউজারনেম (Username)</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="যেমন: ruhul123"
                  className="w-full bg-[#0A0C10] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">পাসওয়ার্ড (Password)</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0A0C10] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={portalLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 text-sm mt-6 cursor-pointer"
              >
                {portalLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>লগইন করুন</span>
                    <Unlock className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGNUP FORM */}
          {authPortalMode === "signup" && (
            <form onSubmit={handleUserSignup} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">আপনার নাম (Full Name)</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="যেমন: রুহুল আমিন"
                  className="w-full bg-[#0A0C10] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">ইউজারনেম (Username)</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="যেমন: ruhul123"
                  className="w-full bg-[#0A0C10] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">পাসওয়ার্ড (Password)</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="কমপক্ষে ৪টি অক্ষর বা সংখ্যা দিন"
                  className="w-full bg-[#0A0C10] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={portalLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 text-sm mt-6 cursor-pointer"
              >
                {portalLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>নিবন্ধন (Sign Up) করুন</span>
                    <Plus className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ADMIN PORTAL FORM */}
          {authPortalMode === "admin" && (
            <form onSubmit={handlePortalAdminLogin} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">অ্যাডমিন পাসওয়ার্ড (Admin Password)</label>
                </div>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="অ্যাডমিন গোপন পিনটি দিন..."
                  className="w-full bg-[#0A0C10] border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={portalLoading}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-amber-600/10 flex items-center justify-center gap-2 text-sm mt-6 cursor-pointer"
              >
                {portalLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>অ্যাডমিন প্যানেলে প্রবেশ</span>
                    <Lock className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-slate-800/60 pt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>নিরাপদ ও সুবিন্যস্ত লিংক ডিরেক্টরি প্ল্যাটফর্ম</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-200 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-slate-900 pb-16 flex flex-col">
      
      {/* Background Decorative Grid and Spots */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),rgba(255,255,255,0))]" />
      <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[50%] right-[-10%] w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Admin Info Banner */}
      <AnimatePresence>
        {isAdmin && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-950/90 border-b border-emerald-500/30 text-emerald-100 py-2.5 px-6 sticky top-0 z-50 backdrop-blur-md flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>রুহুল ওয়েব অ্যাডমিন প্যানেল সক্রিয় রয়েছে!</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={openAddModal}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-md flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন লিংক</span>
              </button>
              <button 
                onClick={handleLogout}
                className="bg-slate-900/60 hover:bg-rose-950 hover:text-rose-300 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 border border-slate-800 hover:border-rose-900"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar from Theme */}
      <nav className="h-20 border-b border-slate-800/80 flex items-center justify-between px-4 md:px-10 bg-[#0F1117] sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white tracking-wider">
            RW
          </div>
          <span className="text-xl md:text-2xl font-black tracking-wider text-white italic uppercase">
            RUHUL WEB
          </span>
        </div>
        
        {/* Navigation Middle Links */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
          <button 
            onClick={() => { setSelectedType("all"); setSelectedCategory("all"); }}
            className={`transition-colors py-1 cursor-pointer ${selectedType === "all" ? "text-indigo-400 border-b-2 border-indigo-500 pb-1" : "hover:text-white"}`}
          >
            সব লিংক ({links.length})
          </button>
          <button 
            onClick={() => { setSelectedType("product"); setSelectedCategory("all"); }}
            className={`transition-colors py-1 cursor-pointer ${selectedType === "product" ? "text-indigo-400 border-b-2 border-indigo-500 pb-1" : "hover:text-white"}`}
          >
            Affiliate Products
          </button>
          <button 
            onClick={() => { setSelectedType("app"); setSelectedCategory("all"); }}
            className={`transition-colors py-1 cursor-pointer ${selectedType === "app" ? "text-indigo-400 border-b-2 border-indigo-500 pb-1" : "hover:text-white"}`}
          >
            Proprietary Apps
          </button>
        </div>

        {/* System Online Badge & Login Button */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Online</span>
          </div>

          {isUser && userProfile && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400">মেম্বার:</span>
                <span className="text-indigo-300 font-extrabold">{userProfile.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 p-2.5 rounded-xl border border-slate-800 hover:border-rose-500/20 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="লগআউট"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Header Area */}
      <header className="max-w-6xl mx-auto px-4 pt-12 pb-8 relative z-10 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mt-2"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/30 border border-indigo-500/20 rounded-full text-indigo-300 text-xs uppercase tracking-wider font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Premium Link Directory & Affiliate Console</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight uppercase font-sans">
            রুহুল ওয়েব <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-400 to-indigo-400">লিংক হাব</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-light max-w-2xl mx-auto">
            আমার তৈরি আধুনিক ওয়েব অ্যাপ্লিকেশনস এবং বিভিন্ন প্ল্যাটফর্মের (দারাজ, অ্যামাজন ইত্যাদি) চমৎকার সব প্রোডাক্ট ও প্রয়োজনীয় গ্যাজেটগুলোর একটি নিখুঁত ডিরেক্টরি। সব দরকারি লিংক সরাসরি ভিজিট করুন কোনো ঝামেলা ছাড়াই।
          </p>
        </motion.div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 relative z-10">
        
        {/* Search and Filters Hub */}
        <div className="bg-[#0F1117] border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-xl mb-12">
          
          {/* Top Line: Search & Links Group Toggle */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-5">
            {/* Search Box */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="প্রোডাক্ট বা অ্যাপের নাম লিখে খুঁজুন..."
                className="w-full bg-[#0A0C10] border border-slate-800/80 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder:text-slate-600 outline-none transition-all text-sm sm:text-base focus:ring-1 focus:ring-indigo-500/20"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 p-0.5 rounded-full hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div className="flex p-1 bg-[#0A0C10] border border-slate-800/80 rounded-xl w-full md:w-auto">
              <button 
                onClick={() => { setSelectedType("all"); setSelectedCategory("all"); }}
                className={`flex-1 md:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                  selectedType === "all" 
                    ? "bg-slate-900 border border-slate-700/50 text-white shadow" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                সব লিংক ({links.length})
              </button>
              <button 
                onClick={() => { setSelectedType("product"); setSelectedCategory("all"); }}
                className={`flex-1 md:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  selectedType === "product" 
                    ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>অ্যাফিলিয়েট প্রোডাক্টস ({links.filter(l => l.type === "product").length})</span>
              </button>
              <button 
                onClick={() => { setSelectedType("app"); setSelectedCategory("all"); }}
                className={`flex-1 md:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  selectedType === "app" 
                    ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>আমার তৈরি অ্যাপস ({links.filter(l => l.type === "app").length})</span>
              </button>
            </div>
          </div>

          {/* Bottom Line: Category Tags */}
          <div className="border-t border-slate-800/60 pt-4 flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 select-none">
              <Tag className="w-3.5 h-3.5" />
              <span>ক্যাটাগরি:</span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {getCategories().map((cat) => {
                const label = cat === "all" ? "সব ক্যাটাগরি" : cat;
                return (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      selectedCategory === cat 
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/10" 
                        : "bg-[#0A0C10] hover:bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Global Floating Alert Notification */}
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-950 border border-emerald-500 text-emerald-200 py-3 px-5 rounded-xl shadow-2xl shadow-emerald-900/20 max-w-md"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
              <button onClick={() => setSuccessMessage("")} className="ml-auto p-0.5 text-emerald-400 hover:text-emerald-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-rose-950 border border-rose-500 text-rose-200 py-3 px-5 rounded-xl shadow-2xl shadow-rose-900/20 max-w-md"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-sm font-medium">{errorMessage}</span>
              <button onClick={() => setErrorMessage("")} className="ml-auto p-0.5 text-rose-400 hover:text-rose-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Directory Layout */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-slate-400 text-sm">নতুন আপডেট ও লিংকগুলো নিয়ে আসা হচ্ছে...</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-[#0F1117] rounded-2xl border border-slate-800/80"
          >
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">কোনো লিংক পাওয়া যায়নি!</h3>
            <p className="text-slate-500 text-sm mt-1">ভিন্ন শব্দ লিখে খুঁজুন অথবা অন্য কোনো ফিল্টার নির্বাচন করুন।</p>
            {isAdmin && (
              <button 
                onClick={openAddModal}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                নতুন লিংক যুক্ত করুন
              </button>
            )}
          </motion.div>
        ) : selectedType === "all" ? (
          /* Balanced Geometric Split Layout */
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            
            {/* Left Section: Global Affiliate Marketplace */}
            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-6 pb-2 border-b border-slate-800/60">
                <h2 className="text-2xl font-light text-white uppercase tracking-wider">
                  Global <span className="font-extrabold text-indigo-500 underline underline-offset-8">Affiliate</span>
                </h2>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Affiliate Marketplace ({filteredProducts.length})</span>
              </div>

              {filteredProducts.length === 0 ? (
                <p className="text-slate-500 text-sm py-12 text-center bg-[#0F1117]/50 rounded-2xl border border-slate-800/40">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredProducts.map(link => renderProductCard(link))}
                </div>
              )}
            </div>

            {/* Right Section: Proprietary App Console */}
            <div className="w-full lg:w-[420px] shrink-0">
              <div className="flex justify-between items-end mb-6 pb-2 border-b border-slate-800/60">
                <h2 className="text-2xl font-light text-white uppercase tracking-wider">
                  Proprietary <span className="font-extrabold text-indigo-500 underline underline-offset-8">Apps</span>
                </h2>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Active Console ({filteredApps.length})</span>
              </div>

              {filteredApps.length === 0 ? (
                <p className="text-slate-500 text-sm py-12 text-center bg-[#0F1117]/50 rounded-2xl border border-slate-800/40">কোনো অ্যাপ্লিকেশন পাওয়া যায়নি।</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {filteredApps.map(link => renderAppCard(link))}
                </div>
              )}
            </div>

          </div>
        ) : selectedType === "product" ? (
          /* Full Screen Grid for Daraz Products */
          <div>
            <div className="flex justify-between items-end mb-6 pb-2 border-b border-slate-800/60">
              <h2 className="text-2xl font-light text-white uppercase tracking-wider">
                Global <span className="font-extrabold text-indigo-500 underline underline-offset-8">Affiliate Marketplace</span>
              </h2>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Total Product Count: {filteredProducts.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(link => renderProductCard(link))}
            </div>
          </div>
        ) : (
          /* Full Screen Grid for Apps */
          <div>
            <div className="flex justify-between items-end mb-6 pb-2 border-b border-slate-800/60">
              <h2 className="text-2xl font-light text-white uppercase tracking-wider">
                Proprietary <span className="font-extrabold text-indigo-500 underline underline-offset-8">Applications</span>
              </h2>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Total App Count: {filteredApps.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map(link => renderAppCard(link))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="max-w-6xl mx-auto px-4 mt-24 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
            R
          </div>
          <span className="font-medium text-slate-400">Ruhul Web © 2026</span>
        </div>
        <p className="text-center sm:text-right text-slate-600 leading-relaxed">
          এই সাইটের সকল দারাজ প্রোডাক্ট লিংক এবং ওয়ান-ক্লিক অ্যাপ্লিকেশন সম্পূর্ণ সুরক্ষিত এবং রুহুল কর্তৃক ভেরিফাইড। 
        </p>
      </footer>



      {/* ADMIN ADD/EDIT FORM MODAL */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8"
            >
              <button 
                onClick={() => setShowFormModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-100 p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg mb-1">
                  <FolderPlus className="w-5 h-5" />
                  <span>{formMode === "add" ? "নতুন লিংক যুক্ত করুন" : "লিংক সংশোধন করুন"}</span>
                </div>
                <p className="text-slate-400 text-xs">আপনার ওয়েবসাইটের দর্শনার্থীদের জন্য সঠিক তথ্য দিন।</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">লিংকের ধরণ</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("product");
                        if (!formCategory || formCategory === "Utility" || formCategory === "Gaming") {
                          setFormCategory("Electronics");
                        }
                      }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        formType === "product"
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      দারাজ প্রোডাক্ট
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("app");
                        if (!formCategory || formCategory === "Electronics" || formCategory === "Gadgets" || formCategory === "Accessories") {
                          setFormCategory("Utility");
                        }
                      }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        formType === "app"
                          ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      তৈরি করা অ্যাপ/সাইট
                    </button>
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">শিরোনাম (Title) *</label>
                    <input 
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="যেমন: M10 Wireless Earbuds"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm"
                    />
                  </div>

                  {/* URL */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">লিংক এড্রেস (URL) *</label>
                    <input 
                      type="url"
                      required
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="https://daraz.com.bd/..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">ক্যাটাগরি</label>
                    {formType === "product" ? (
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-100 outline-none transition-all text-sm cursor-pointer"
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Gadgets">Gadgets</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Books">Books</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-100 outline-none transition-all text-sm cursor-pointer"
                      >
                        <option value="Utility">Utility App</option>
                        <option value="Gaming">Gaming</option>
                        <option value="Education">Education</option>
                        <option value="Productivity">Productivity</option>
                        <option value="Social">Social</option>
                        <option value="Portfolio">Portfolio</option>
                      </select>
                    )}
                  </div>

                  {/* Price (Product only) */}
                  {formType === "product" && (
                    <div>
                      <label className="block text-slate-300 text-xs font-semibold mb-1.5">মূল্য (যেমন: ৳ ৩৫০)</label>
                      <input 
                        type="text"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="৳ ৩৫০"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm"
                      />
                    </div>
                  )}

                  {/* Image URL (Product only) */}
                  {formType === "product" && (
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 text-xs font-semibold mb-1.5">প্রোডাক্ট ইমেজের লিঙ্ক (Image URL)</label>
                      <input 
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm"
                      />
                    </div>
                  )}

                  {/* Affiliate Platform Selection (Product only) */}
                  {formType === "product" && (
                    <div className="sm:col-span-2 bg-[#0A0C10] p-4 rounded-xl border border-slate-800/80 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        <Tag className="w-3.5 h-3.5" />
                        <span>অ্যাফিলিয়েট প্ল্যাটফর্ম (Affiliate Platform)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1">প্ল্যাটফর্ম নির্বাচন করুন</label>
                          <select
                            value={formPlatform}
                            onChange={(e) => setFormPlatform(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-100 outline-none transition-all text-sm cursor-pointer"
                          >
                            <option value="daraz">Daraz (দারাজ)</option>
                            <option value="amazon">Amazon (অ্যামাজন)</option>
                            <option value="aliexpress">AliExpress (আলীএক্সপ্রেস)</option>
                            <option value="other">Other (অন্যান্য...)</option>
                          </select>
                        </div>
                        
                        {formPlatform === "other" ? (
                          <div>
                            <label className="block text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1">প্ল্যাটফর্মের নাম লিখুন *</label>
                            <input 
                              type="text"
                              required
                              value={customPlatform}
                              onChange={(e) => setCustomPlatform(e.target.value)}
                              placeholder="যেমন: Walmart, Star Tech, BDShop"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm"
                            />
                          </div>
                        ) : (
                          <div className="flex items-end text-[11px] text-slate-500 pb-2.5">
                            <span>নির্বাচিত প্ল্যাটফর্মের ব্র্যান্ডিং ও থিম কার্ডে স্বয়ংক্রিয়ভাবে যুক্ত হবে।</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">সংক্ষিপ্ত বিবরণ (Description)</label>
                    <textarea 
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="প্রোডাক্ট বা অ্যাপের বৈশিষ্ট্য সম্পর্কে কিছু বলুন..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-700 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Form Error Message */}
                {formError && (
                  <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    disabled={formSubmitting}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>সেভ করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>সংরক্ষণ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">আপনি কি নিশ্চিত?</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  এই লিংকটি চিরতরে মুছে ফেলা হবে। আপনি কি নিশ্চিতভাবে লিংকটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব হবে না।
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingLinkId(null);
                  }}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleDeleteLink}
                  disabled={deleteSubmitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {deleteSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "মুছে ফেলুন"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
