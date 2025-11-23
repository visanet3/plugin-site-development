import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MainContent from '@/components/MainContent';
import Dialogs from '@/components/Dialogs';
import AdminPanel from '@/components/AdminPanel';
import UserProfileDialog from '@/components/UserProfileDialog';
import UserProfile from '@/components/UserProfile';
import MessagesPanel from '@/components/MessagesPanel';
import NotificationsPanel from '@/components/NotificationsPanel';
import { Plugin, Category, User, ForumTopic, ForumComment, SearchResult } from '@/types';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useForumHandlers } from '@/hooks/useForumHandlers';
import { useSearchHandlers } from '@/hooks/useSearchHandlers';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';

const Index = () => {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  useUserActivity({
    user,
    setUser,
    setNotificationsUnread,
    setMessagesUnread,
    setAdminNotificationsUnread,
    showAdminToast
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('referralCode', refCode.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      const syncUserData = async () => {
        try {
          const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': parsedUser.id.toString()
            },
            body: JSON.stringify({ action: 'get_user' })
          });
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (error) {
          console.error('Ошибка синхронизации данных пользователя:', error);
        }
      };
      
      syncUserData();
    } else {
      setAuthDialogOpen(true);
      if (refCode) {
        setAuthMode('register');
      }
    }
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    const savedScrollPos = sessionStorage.getItem('scrollPosition');
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos));
        sessionStorage.removeItem('scrollPosition');
      }, 100);
    }
    
    const saveScrollPosition = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };
    
    window.addEventListener('beforeunload', saveScrollPosition);
    
    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
    };
  }, []);

  useEffect(() => {
    const savedTopicId = localStorage.getItem('selectedTopicId');
    if (savedTopicId && activeView === 'forum' && forumTopics.length > 0 && !selectedTopic) {
      const topic = forumTopics.find(t => t.id === parseInt(savedTopicId));
      if (topic) {
        handleTopicSelect(topic);
      }
    }
  }, [forumTopics, activeView]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          username: formData.get('username'),
          email: authMode === 'register' ? formData.get('email') : undefined,
          password: formData.get('password'),
          referral_code: authMode === 'register' ? formData.get('referral_code') : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setAuthDialogOpen(false);
        toast({
          title: 'Успешно',
          description: authMode === 'login' ? 'Вы вошли в систему' : 'Регистрация успешно завершена'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка авторизации',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Вы точно хотите выйти из аккаунта?');
    if (confirmed) {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      toast({
        title: 'Выход выполнен',
        description: 'Вы вышли из аккаунта'
      });
    }
  };

  const handleUpdateProfile = async (profileData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleTopUpBalance = async (amount: number) => {
    if (!user) return;
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'topup_balance',
          amount: amount
        })
      });
      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...user, balance: data.new_balance };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Ошибка пополнения баланса:', error);
      throw error;
    }
  };

  const refreshUserBalance = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${AUTH_URL}?action=get_balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'get_balance'
        })
      });
      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...user, balance: data.balance };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Ошибка обновления баланса:', error);
    }
  };

  const handleCategoryChange = (category: string, view: 'plugins' | 'forum') => {
    setActiveView(view);
    localStorage.setItem('activeView', view);
    if (view === 'plugins') {
      setActiveCategory(category);
      localStorage.setItem('activeCategory', category);
    }
    setSelectedTopic(null);
    localStorage.removeItem('selectedTopicId');
    window.scrollTo(0, 0);
  };

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleSendMessage = (recipientId: number) => {
    setMessageRecipientId(recipientId);
    setShowMessagesPanel(true);
  };

  const handleAuthDialogAttemptClose = () => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Платформой могут пользоваться только зарегистрированные и авторизованные пользователи',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex relative" onClick={() => setShowSearchResults(false)}>
      {showAdminPanel && user?.role === 'admin' ? (
        <AdminPanel currentUser={user} onClose={() => setShowAdminPanel(false)} />
      ) : (
        <>
          <Sidebar
            sidebarOpen={sidebarOpen && !authDialogOpen}
            activeCategory={activeCategory}
            activeView={activeView}
            categories={categories}
            user={user || undefined}
            onCategoryChange={handleCategoryChange}
            onShowProfileDialog={() => {
              if (user) {
                setSelectedUserId(user.id);
                setShowUserProfile(true);
              }
            }}
            onShowAdminPanel={() => setShowAdminPanel(true)}
            onShowMessagesPanel={() => setShowMessagesPanel(true)}
            messagesUnread={messagesUnread}
            adminNotificationsUnread={adminNotificationsUnread}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen && !authDialogOpen ? 'md:ml-64' : 'ml-0'} max-w-full overflow-x-hidden`}>
        <Header
          sidebarOpen={sidebarOpen}
          searchQuery={searchQuery}
          searchResults={searchResults}
          showSearchResults={showSearchResults}
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSearchChange={setSearchQuery}
          onSearchFocus={() => searchQuery && setShowSearchResults(true)}
          onSearchResultClick={handleSearchResultClick}
          onAuthDialogOpen={(mode) => {
            setAuthMode(mode);
            setAuthDialogOpen(true);
          }}
          onLogout={handleLogout}
          notificationsUnread={notificationsUnread}
          onShowNotifications={() => setShowNotificationsPanel(true)}
          onShowProfile={() => {
            if (user) {
              setSelectedUserId(user.id);
              setShowUserProfile(true);
            }
          }}
        />

        <MainContent
          activeView={authDialogOpen ? 'plugins' : activeView}
          activeCategory={authDialogOpen ? 'all' : activeCategory}
          plugins={plugins}
          categories={categories}
          forumTopics={forumTopics}
          selectedTopic={selectedTopic}
          topicComments={topicComments}
          user={user}
          newComment={newComment}
          onShowTopicDialog={() => setShowTopicDialog(true)}
          onTopicSelect={handleTopicSelect}
          onBackToTopics={() => {
            setSelectedTopic(null);
            localStorage.removeItem('selectedTopicId');
          }}
          onCommentChange={setNewComment}
          onCreateComment={handleCreateComment}
          onUserClick={handleUserClick}
          onNavigateToForum={() => setActiveView('forum')}
          onShowAuthDialog={() => setAuthDialogOpen(true)}
          onRefreshUserBalance={refreshUserBalance}
        />
      </div>

      <Dialogs
        authDialogOpen={authDialogOpen}
        authMode={authMode}
        showTopicDialog={showTopicDialog}
        showProfileDialog={showProfileDialog}
        user={user}
        newTopicTitle={newTopicTitle}
        newTopicContent={newTopicContent}
        onAuthDialogChange={setAuthDialogOpen}
        onAuthModeChange={setAuthMode}
        onAuthSubmit={handleAuth}
        onTopicDialogChange={setShowTopicDialog}
        onTopicTitleChange={setNewTopicTitle}
        onTopicContentChange={setNewTopicContent}
        onCreateTopic={handleCreateTopic}
        onProfileDialogChange={setShowProfileDialog}
        onUpdateProfile={handleUpdateProfile}
        onAuthDialogAttemptClose={handleAuthDialogAttemptClose}
      />

      {showUserProfile && selectedUserId && user && selectedUserId === user.id ? (
        <UserProfile
          user={user}
          isOwnProfile={true}
          onClose={() => setShowUserProfile(false)}
          onTopUpBalance={handleTopUpBalance}
          onUpdateProfile={handleUpdateProfile}
        />
      ) : (
        <UserProfileDialog
          open={showUserProfile}
          onOpenChange={setShowUserProfile}
          userId={selectedUserId}
          currentUserId={user?.id}
          onSendMessage={handleSendMessage}
        />
      )}

      {user && (
        <>
          <NotificationsPanel
            open={showNotificationsPanel}
            onOpenChange={(open) => {
              setShowNotificationsPanel(open);
              if (!open) {
                fetch(`${NOTIFICATIONS_URL}?action=notifications`, {
                  headers: { 'X-User-Id': user.id.toString() }
                }).then(res => res.json()).then(data => {
                  setNotificationsUnread(data.unread_count || 0);
                }).catch(() => {});
              }
            }}
            userId={user.id}
          />
          
          <MessagesPanel
            open={showMessagesPanel}
            onOpenChange={(open) => {
              setShowMessagesPanel(open);
              if (!open) {
                setMessageRecipientId(null);
                fetch(`${NOTIFICATIONS_URL}?action=messages`, {
                  headers: { 'X-User-Id': user.id.toString() }
                }).then(res => res.json()).then(data => {
                  setMessagesUnread(data.unread_count || 0);
                }).catch(() => {});
              }
            }}
            userId={user.id}
            initialRecipientId={messageRecipientId}
          />
        </>
      )}
        </>
      )}

      {!user && (
        <>
          <div className="fixed inset-0 backdrop-blur-[2px] bg-background/9 z-40 pointer-events-none" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-background/95 backdrop-blur-xl border-2 border-primary/50 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
              <Dialogs
                authDialogOpen={true}
                authMode={authMode}
                showTopicDialog={false}
                showProfileDialog={false}
                user={null}
                newTopicTitle=""
                newTopicContent=""
                onAuthDialogChange={() => {}}
                onAuthModeChange={setAuthMode}
                onAuthSubmit={handleAuth}
                onTopicDialogChange={() => {}}
                onTopicTitleChange={() => {}}
                onTopicContentChange={() => {}}
                onCreateTopic={() => {}}
                onProfileDialogChange={() => {}}
                onUpdateProfile={() => {}}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;