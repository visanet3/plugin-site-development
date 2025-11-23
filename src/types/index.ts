export interface Plugin {
  id: number;
  title: string;
  description: string;
  downloads: number;
  rating: string;
  status: string;
  tags: string[];
  gradient_from: string;
  gradient_to: string;
  category_name: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  vk_url?: string;
  telegram?: string;
  discord?: string;
  bio?: string;
  role?: string;
  forum_role?: string;
  is_blocked?: boolean;
  balance?: number;
  referred_by_code?: string;
  referral_bonus_claimed?: boolean;
  vip_until?: string;
}

export interface ForumTopic {
  id: number;
  title: string;
  content?: string;
  views: number;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
  author_id?: number;
  author_name: string;
  author_avatar?: string;
  author_forum_role?: string;
  author_last_seen?: string;
  comments_count: number;
}

export interface ForumComment {
  id: number;
  content: string;
  created_at: string;
  author_id: number;
  author_name: string;
  author_avatar: string | null;
  author_forum_role?: string;
  author_last_seen?: string;
  parent_id?: number | null;
  replies?: ForumComment[];
}

export interface SearchResult {
  type: 'plugin' | 'topic' | 'category';
  id: number;
  title: string;
  description?: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: number;
  from_user_id: number;
  from_username: string;
  from_avatar?: string;
  to_user_id: number;
  to_username: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface EscrowDeal {
  id: number;
  seller_id: number;
  seller_name?: string;
  seller_avatar?: string;
  buyer_id?: number;
  buyer_name?: string;
  buyer_avatar?: string;
  title: string;
  description: string;
  price: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'dispute';
  buyer_paid: boolean;
  seller_confirmed: boolean;
  buyer_confirmed: boolean;
  dispute: boolean;
  dispute_reason?: string;
  admin_decision?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface EscrowMessage {
  id: number;
  deal_id: number;
  user_id: number;
  username?: string;
  avatar_url?: string;
  message: string;
  is_system: boolean;
  created_at: string;
}