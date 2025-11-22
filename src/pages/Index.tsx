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

const BACKEND_URL = 'https://functions.poehali.dev/1e67c3bd-abb5-4647-aa02-57410816c1f0';
const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';
const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';
const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';
const CRYPTO_URL = 'https://functions.poehali.dev/8caa3b76-72e5-42b5-9415-91d1f9b05210';

const Index = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeView, setActiveView] = useState<'plugins' | 'forum'>('plugins');
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
  const [messageRecipientId, setMessageRecipientId] = useState<number | null>(null);

  useEffect(() => {
    if (activeView === 'plugins') {
      fetchPlugins();
    } else if (activeView === 'forum') {
      fetchForumTopics();
    }
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [activeCategory, activeView]);

  useEffect(() => {
    if (user) {
      const updateActivity = () => {
        fetch(AUTH_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify({ action: 'update_activity' })
        }).catch(() => {});
      };

      const fetchUnreadCount = async () => {
        try {
          const [notifRes, msgRes] = await Promise.all([
            fetch(`${NOTIFICATIONS_URL}?action=notifications`, {
              headers: { 'X-User-Id': user.id.toString() }
            }),
            fetch(`${NOTIFICATIONS_URL}?action=messages`, {
              headers: { 'X-User-Id': user.id.toString() }
            })
          ]);

          if (notifRes.ok && msgRes.ok) {
            const notifData = await notifRes.json();
            const msgData = await msgRes.json();
            setNotificationsUnread(notifData.unread_count || 0);
            setMessagesUnread(msgData.unread_count || 0);
          }
        } catch (error) {
          console.error('Failed to fetch unread count:', error);
        }
      };

      const checkPendingPayments = async () => {
        try {
          const response = await fetch(`${CRYPTO_URL}?action=check_pending`, {
            headers: { 'X-User-Id': user.id.toString() }
          });
          const data = await response.json();
          if (data.success && data.count > 0) {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
              const currentUser = JSON.parse(savedUser);
              const totalAmount = data.auto_confirmed.reduce((sum: number, p: any) => sum + p.amount, 0);
              const updatedBalance = (currentUser.balance || 0) + totalAmount;
              const updatedUser = { ...currentUser, balance: updatedBalance };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              if (totalAmount > 0) {
                if (Notification.permission === 'granted') {
                  new Notification('💰 Баланс пополнен!', {
                    body: `Зачислено ${totalAmount.toFixed(2)} USDT`,
                    icon: '/favicon.ico'
                  });
                }
                
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5a');
                audio.volume = 0.3;
                audio.play().catch(() => {});
              }
            }
          }
        } catch (error) {
          console.error('Failed to check pending payments:', error);
        }
      };

      updateActivity();
      fetchUnreadCount();
      checkPendingPayments();
      
      const activityInterval = setInterval(updateActivity, 60 * 1000);
      const unreadInterval = setInterval(fetchUnreadCount, 30 * 1000);
      const paymentsInterval = setInterval(checkPendingPayments, 30 * 1000);
      
      return () => {
        clearInterval(activityInterval);
        clearInterval(unreadInterval);
        clearInterval(paymentsInterval);
      };
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const fetchPlugins = async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${BACKEND_URL}?${params}`);
      const data = await response.json();
      setPlugins(data.plugins || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

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
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setAuthDialogOpen(false);
      } else {
        alert(data.error || 'Ошибка');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка подключения');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const fetchForumTopics = async (pluginId?: number) => {
    try {
      const params = new URLSearchParams();
      if (pluginId) params.append('plugin_id', pluginId.toString());
      const response = await fetch(`${FORUM_URL}?${params}`);
      const data = await response.json();
      setForumTopics(data.topics || []);
    } catch (error) {
      console.error('Ошибка загрузки тем:', error);
    }
  };

  const handleCreateTopic = async () => {
    if (!user) {
      alert('Войдите для создания темы');
      return;
    }
    if (!newTopicTitle || !newTopicContent) {
      alert('Заполните все поля');
      return;
    }
    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'create_topic',
          title: newTopicTitle,
          content: newTopicContent
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewTopicTitle('');
        setNewTopicContent('');
        setShowTopicDialog(false);
        setActiveView('forum');
        fetchForumTopics();
      }
    } catch (error) {
      console.error('Ошибка создания темы:', error);
    }
  };

  const handleCreateComment = async () => {
    if (!user) {
      alert('Войдите для комментирования');
      return;
    }
    if (!newComment || !selectedTopic) return;
    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'create_comment',
          topic_id: selectedTopic.id,
          content: newComment
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewComment('');
        const topicResponse = await fetch(`${FORUM_URL}?topic_id=${selectedTopic.id}`);
        const topicData = await topicResponse.json();
        setTopicComments(topicData.comments || []);
      }
    } catch (error) {
      console.error('Ошибка создания комментария:', error);
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

  const handleSearch = async () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results: SearchResult[] = [];

    plugins.forEach(plugin => {
      if (plugin.title.toLowerCase().includes(query) || 
          plugin.description.toLowerCase().includes(query) ||
          plugin.tags.some(tag => tag.toLowerCase().includes(query))) {
        results.push({
          type: 'plugin',
          id: plugin.id,
          title: plugin.title,
          description: plugin.description
        });
      }
    });

    categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(query)) {
        results.push({
          type: 'category',
          id: cat.id,
          title: cat.name,
          description: `Категория: ${cat.name}`
        });
      }
    });

    forumTopics.forEach(topic => {
      if (topic.title.toLowerCase().includes(query) || 
          topic.content?.toLowerCase().includes(query)) {
        results.push({
          type: 'topic',
          id: topic.id,
          title: topic.title,
          description: topic.content?.substring(0, 100)
        });
      }
    });

    setSearchResults(results.slice(0, 10));
    setShowSearchResults(true);
  };

  const handleSearchResultClick = async (result: SearchResult) => {
    setShowSearchResults(false);
    setSearchQuery('');
    
    if (result.type === 'plugin') {
      setActiveView('plugins');
      setActiveCategory('plugins');
    } else if (result.type === 'category') {
      const category = categories.find(c => c.id === result.id);
      if (category) {
        setActiveView('plugins');
        setActiveCategory(category.slug);
      }
    } else if (result.type === 'topic') {
      setActiveView('forum');
      const topic = forumTopics.find(t => t.id === result.id);
      if (topic) {
        setSelectedTopic(topic);
        try {
          const response = await fetch(`${FORUM_URL}?topic_id=${topic.id}`);
          const data = await response.json();
          setTopicComments(data.comments || []);
        } catch (error) {
          console.error('Ошибка загрузки комментариев:', error);
        }
      }
    }
  };

  const handleCategoryChange = (category: string, view: 'plugins' | 'forum') => {
    setActiveView(view);
    if (view === 'plugins') {
      setActiveCategory(category === 'categories' ? 'all' : category);
    }
    setSelectedTopic(null);
  };

  const handleTopicSelect = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    try {
      const response = await fetch(`${FORUM_URL}?topic_id=${topic.id}`);
      const data = await response.json();
      setTopicComments(data.comments || []);
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    }
  };

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleSendMessage = (recipientId: number) => {
    setMessageRecipientId(recipientId);
    setShowMessagesPanel(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex" onClick={() => setShowSearchResults(false)}>
      {showAdminPanel && user?.role === 'admin' ? (
        <AdminPanel currentUser={user} onClose={() => setShowAdminPanel(false)} />
      ) : (
        <>
          <Sidebar
            sidebarOpen={sidebarOpen}
            activeCategory={activeCategory}
            activeView={activeView}
            categories={categories}
            user={user}
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
          />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
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
          activeView={activeView}
          activeCategory={activeCategory}
          plugins={plugins}
          categories={categories}
          forumTopics={forumTopics}
          selectedTopic={selectedTopic}
          topicComments={topicComments}
          user={user}
          newComment={newComment}
          onShowTopicDialog={() => setShowTopicDialog(true)}
          onTopicSelect={handleTopicSelect}
          onBackToTopics={() => setSelectedTopic(null)}
          onCommentChange={setNewComment}
          onCreateComment={handleCreateComment}
          onUserClick={handleUserClick}
          onNavigateToForum={() => setActiveView('forum')}
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
    </div>
  );
};

export default Index;