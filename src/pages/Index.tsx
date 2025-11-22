import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

const BACKEND_URL = 'https://functions.poehali.dev/1e67c3bd-abb5-4647-aa02-57410816c1f0';
const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';
const PROFILE_URL = 'https://functions.poehali.dev/74bcb5c3-ddb7-4f36-b172-909af29200f2';

interface Plugin {
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

interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  vk_url?: string;
  telegram?: string;
  discord?: string;
  bio?: string;
}

interface ForumTopic {
  id: number;
  title: string;
  content?: string;
  views: number;
  is_pinned: boolean;
  created_at: string;
  author_name: string;
  comments_count: number;
}

interface ForumComment {
  id: number;
  content: string;
  created_at: string;
  author_id: number;
  author_name: string;
  author_avatar: string | null;
}

const Index = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
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

  useEffect(() => {
    fetchPlugins();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [activeCategory, searchQuery]);

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

  const filteredPlugins = plugins.filter(p => 
    activeCategory === 'all' || p.category_name === categories.find(c => c.slug === activeCategory)?.name
  );

  const sortPlugins = (sortBy: string) => {
    const sorted = [...filteredPlugins];
    if (sortBy === 'newest') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortBy === 'popular') sorted.sort((a, b) => b.downloads - a.downloads);
    if (sortBy === 'rating') sorted.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    return sorted;
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

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className={`fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30 ${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'}`}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Icon name="Layers" size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">ТП</span>
          </div>

          <nav className="space-y-1">
            {[
              { icon: 'Home', label: 'Главная', id: 'all' },
              { icon: 'Package', label: 'Плагины', id: 'plugins' },
              { icon: 'Grid3x3', label: 'Категории', id: 'categories' },
              { icon: 'Sparkles', label: 'Новинки', id: 'new' },
              { icon: 'TrendingUp', label: 'Популярное', id: 'popular' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id === 'categories' ? 'all' : item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  activeCategory === item.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon name={item.icon as any} size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
            
            {user && (
              <>
                <button
                  onClick={() => setShowProfileDialog(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors hover:bg-sidebar-accent/50 mt-4"
                >
                  <Icon name="User" size={18} />
                  <span className="text-sm font-medium">Личный кабинет</span>
                </button>
                <button
                  onClick={() => setShowTopicDialog(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors hover:bg-sidebar-accent/50 bg-primary/10 border border-primary/20"
                >
                  <Icon name="Plus" size={18} />
                  <span className="text-sm font-medium">Создать тему</span>
                </button>
              </>
            )}
          </nav>

          <div className="mt-8 pt-8 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground px-4 mb-3">КАТЕГОРИИ</p>
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                  activeCategory === cat.slug ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${cat.color}`} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="sticky top-0 z-20 bg-card border-b border-border backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4 flex-1">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Icon name="Menu" size={20} />
              </Button>

              <div className="relative max-w-md w-full">
                <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="ghost" size="icon">
                    <Icon name="Bell" size={20} />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      Выход
                    </Button>
                  </div>
                </>
              ) : (
                <Button 
                  onClick={() => setAuthDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90 font-semibold px-6"
                >
                  РЕГИСТРАЦИЯ
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {activeCategory === 'all' ? 'Все разделы' : 
               activeCategory === 'new' ? 'Новинки' : 
               activeCategory === 'popular' ? 'Популярное' :
               categories.find(c => c.slug === activeCategory)?.name || 'Плагины'}
            </h1>
            <p className="text-muted-foreground">
              {filteredPlugins.length} {filteredPlugins.length === 1 ? 'плагин' : 'плагинов'}
            </p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <Tabs defaultValue="newest">
              <TabsList>
                <TabsTrigger value="newest">Последние посты</TabsTrigger>
                <TabsTrigger value="new">Новые темы</TabsTrigger>
                <TabsTrigger value="hot">Горячие темы</TabsTrigger>
                <TabsTrigger value="views">Наиболее просматриваемые</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {user && (
              <Button onClick={() => setShowTopicDialog(true)} className="bg-primary">
                <Icon name="Plus" size={18} className="mr-2" />
                Создать тему
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {sortPlugins('newest').map((plugin) => (
              <div
                key={plugin.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${plugin.gradient_from}, ${plugin.gradient_to})`
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {plugin.status === 'premium' && (
                            <Badge variant="default" className="bg-primary">
                              СБОРКА
                            </Badge>
                          )}
                          {plugin.status === 'new' && (
                            <Badge variant="secondary" className="bg-accent">
                              НОВЫЙ
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                          {plugin.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {plugin.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Icon name="Download" size={14} />
                          <span>{plugin.downloads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Star" size={14} className="text-yellow-500 fill-yellow-500" />
                          <span>{plugin.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          <span>{new Date(plugin.created_at).toLocaleDateString('ru')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {plugin.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{authMode === 'login' ? 'Вход' : 'Регистрация'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Имя пользователя</label>
              <Input name="username" required />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input name="email" type="email" required />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Пароль</label>
              <Input name="password" type="password" required />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>

            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            >
              {authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать новую тему</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Название темы</label>
              <Input 
                value={newTopicTitle} 
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Введите название темы"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Описание</label>
              <Textarea 
                value={newTopicContent}
                onChange={(e) => setNewTopicContent(e.target.value)}
                className="min-h-[150px]"
                placeholder="Опишите вашу тему..."
              />
            </div>
            <Button onClick={handleCreateTopic} className="w-full bg-primary">
              Создать тему
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Личный кабинет</DialogTitle>
          </DialogHeader>
          {user && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user.username}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">О себе</label>
                  <Textarea 
                    defaultValue={user.bio || ''}
                    onBlur={(e) => handleUpdateProfile({ bio: e.target.value })}
                    className="min-h-[100px]"
                    placeholder="Расскажите о себе..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                      <Icon name="MessageCircle" size={16} />
                      VK
                    </label>
                    <Input 
                      defaultValue={user.vk_url || ''}
                      onBlur={(e) => handleUpdateProfile({ vk_url: e.target.value })}
                      placeholder="https://vk.com/..."
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                      <Icon name="Send" size={16} />
                      Telegram
                    </label>
                    <Input 
                      defaultValue={user.telegram || ''}
                      onBlur={(e) => handleUpdateProfile({ telegram: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                      <Icon name="MessageSquare" size={16} />
                      Discord
                    </label>
                    <Input 
                      defaultValue={user.discord || ''}
                      onBlur={(e) => handleUpdateProfile({ discord: e.target.value })}
                      placeholder="username#1234"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                      <Icon name="Image" size={16} />
                      URL аватарки
                    </label>
                    <Input 
                      defaultValue={user.avatar_url || ''}
                      onBlur={(e) => handleUpdateProfile({ avatar_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;