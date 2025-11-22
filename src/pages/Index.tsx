import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MainContent from '@/components/MainContent';
import Dialogs from '@/components/Dialogs';
import AdminPanel from '@/components/AdminPanel';
import UserProfileDialog from '@/components/UserProfileDialog';
import { Plugin, Category, User, ForumTopic, ForumComment, SearchResult } from '@/types';

const BACKEND_URL = 'https://functions.poehali.dev/1e67c3bd-abb5-4647-aa02-57410816c1f0';
const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';
const PROFILE_URL = 'https://functions.poehali.dev/74bcb5c3-ddb7-4f36-b172-909af29200f2';

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

      updateActivity();
      const interval = setInterval(updateActivity, 2 * 60 * 1000);
      
      return () => clearInterval(interval);
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
    try {
      const response = await fetch(PROFILE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
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
            onShowProfileDialog={() => setShowProfileDialog(true)}
            onShowAdminPanel={() => setShowAdminPanel(true)}
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

      <UserProfileDialog
        open={showUserProfile}
        onOpenChange={setShowUserProfile}
        userId={selectedUserId}
      />
        </>
      )}
    </div>
  );
};

export default Index;