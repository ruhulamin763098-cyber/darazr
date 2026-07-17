export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  type: 'product' | 'app';
  price?: string; // e.g., "৳ ২৫০"
  imageUrl?: string; // Image URL or thumbnail URL
  category?: string; // e.g., "Electronics", "Utility App", "Gaming", etc.
  platform?: string; // e.g., "daraz", "amazon", "aliexpress", "other"
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}
