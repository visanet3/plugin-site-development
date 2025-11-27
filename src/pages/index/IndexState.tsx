import { useState, useEffect } from 'react';
import { Plugin, Category, User, ForumTopic, ForumComment, SearchResult } from '@/types';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useForumHandlers } from '@/hooks/useForumHandlers';
import { useSearchHandlers } from '@/hooks/useSearchHandlers';
import { useToast } from '@/hooks/use-toast';

export const useIndexState = () => {
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return localStorage.getItem('activeCategory') || 'all';
  });
  const [activeView, setActiveView] = useState<'plugins' | 'forum'>(() => {
    return (localStorage.getItem('activeView') as 'plugins' | 'forum') || 'plugins';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) return false;
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) return saved === 'true';
    return true;
  });
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [topicComments, setTopicComments] = useState<ForumComment[]>([]);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [adminNotificationsUnread, setAdminNotificationsUnread] = useState(0);
  const [messageRecipientId, setMessageRecipientId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  const { fetchPlugins, fetchForumTopics } = useDataFetching({
    activeView,
    activeCategory,
    searchQuery,
    setPlugins,
    setCategories,
    setForumTopics
  });

  const showAdminToast = (title: string, description: string) => {
    toast({
      title,
      description,
      className: 'bg-yellow-500/10 border-yellow-500/30 text-foreground',
      duration: 5000
    });
  };

  const showToast = (title: string, description: string, className?: string, duration?: number) => {
    toast({
      title,
      description,
      className,
      duration
    });
  };

  useUserActivity({
    user,
    setUser,
    setNotificationsUnread,
    setMessagesUnread,
    setAdminNotificationsUnread,
    showAdminToast,
    showToast,
    onUserBlocked: () => {
      setAuthDialogOpen(true);
      setShowAdminPanel(false);
      setShowUserProfile(false);
      setShowMessagesPanel(false);
      setShowNotificationsPanel(false);
    }
  });

  const { handleCreateTopic, handleCreateComment, handleTopicSelect } = useForumHandlers({
    user,
    selectedTopic,
    newTopicTitle,
    newTopicContent,
    newComment,
    setSelectedTopic,
    setTopicComments,
    setNewTopicTitle,
    setNewTopicContent,
    setShowTopicDialog,
    setActiveView,
    fetchForumTopics,
    setNewComment,
    setForumTopics
  });

  const { handleSearchResultClick } = useSearchHandlers({
    searchQuery,
    plugins,
    categories,
    forumTopics,
    setSearchResults,
    setShowSearchResults,
    setActiveView,
    setActiveCategory,
    setSelectedTopic,
    setTopicComments
  });

  return {
    toast,
    plugins,
    setPlugins,
    categories,
    setCategories,
    activeCategory,
    setActiveCategory,
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    setSidebarOpen,
    authDialogOpen,
    setAuthDialogOpen,
    user,
    setUser,
    authMode,
    setAuthMode,
    forumTopics,
    setForumTopics,
    selectedTopic,
    setSelectedTopic,
    topicComments,
    setTopicComments,
    showTopicDialog,
    setShowTopicDialog,
    showProfileDialog,
    setShowProfileDialog,
    newTopicTitle,
    setNewTopicTitle,
    newTopicContent,
    setNewTopicContent,
    newComment,
    setNewComment,
    searchResults,
    setSearchResults,
    showSearchResults,
    setShowSearchResults,
    showAdminPanel,
    setShowAdminPanel,
    showUserProfile,
    setShowUserProfile,
    selectedUserId,
    setSelectedUserId,
    showMessagesPanel,
    setShowMessagesPanel,
    showNotificationsPanel,
    setShowNotificationsPanel,
    notificationsUnread,
    setNotificationsUnread,
    messagesUnread,
    setMessagesUnread,
    adminNotificationsUnread,
    setAdminNotificationsUnread,
    messageRecipientId,
    setMessageRecipientId,
    fetchPlugins,
    fetchForumTopics,
    handleCreateTopic,
    handleCreateComment,
    handleTopicSelect,
    handleSearchResultClick
  };
};