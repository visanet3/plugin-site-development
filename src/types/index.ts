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
}

export interface ForumTopic {
  id: number;
  title: string;
  content?: string;
  views: number;
  is_pinned: boolean;
  created_at: string;
  author_name: string;
  author_forum_role?: string;
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
}

export interface SearchResult {
  type: 'plugin' | 'topic' | 'category';
  id: number;
  title: string;
  description?: string;
}