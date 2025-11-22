import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import ForumRoleBadge from '@/components/ForumRoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plugin, Category, ForumTopic, ForumComment, User } from '@/types';

interface MainContentProps {
  activeView: 'plugins' | 'forum';
  activeCategory: string;
  plugins: Plugin[];
  categories: Category[];
  forumTopics: ForumTopic[];
  selectedTopic: ForumTopic | null;
  topicComments: ForumComment[];
  user: User | null;
  newComment: string;
  onShowTopicDialog: () => void;
  onTopicSelect: (topic: ForumTopic) => void;
  onBackToTopics: () => void;
  onCommentChange: (comment: string) => void;
  onCreateComment: () => void;
  onUserClick: (userId: number) => void;
}

const MainContent = ({
  activeView,
  activeCategory,
  plugins,
  categories,
  forumTopics,
  selectedTopic,
  topicComments,
  user,
  newComment,
  onShowTopicDialog,
  onTopicSelect,
  onBackToTopics,
  onCommentChange,
  onCreateComment,
  onUserClick,
}: MainContentProps) => {
  const filteredPlugins = plugins.filter(p => 
    activeCategory === 'all' || p.category_name === categories.find(c => c.slug === activeCategory)?.name
  );

  const isUserOnline = (lastSeenAt?: string) => {
    if (!lastSeenAt) return false;
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    return diffMinutes < 5;
  };

  const sortPlugins = (sortBy: string) => {
    const sorted = [...filteredPlugins];
    if (sortBy === 'newest') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortBy === 'popular') sorted.sort((a, b) => b.downloads - a.downloads);
    if (sortBy === 'rating') sorted.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    return sorted;
  };

  return (
    <main className="p-6 animate-fade-in">
      {activeView === 'plugins' ? (
        <>
          <div className="mb-6 animate-slide-up">
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

          {activeCategory === 'all' ? (
            <div className="flex items-center justify-center min-h-[400px] animate-scale-in">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-scale-in">
                  <Icon name="Layers" size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Добро пожаловать!</h2>
                <p className="text-muted-foreground">Выберите раздел в меню слева</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortPlugins('newest').map((plugin, index) => (
            <div
              key={plugin.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
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
          )}
        </>
      ) : selectedTopic ? (
        <>
          <div className="mb-6 animate-slide-up">
            <Button variant="ghost" onClick={onBackToTopics} className="mb-4">
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Назад к темам
            </Button>
            <div className="bg-card border border-border rounded-xl p-6 animate-scale-in">
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <Avatar 
                    className="w-12 h-12 cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => selectedTopic.author_id && onUserClick(selectedTopic.author_id)}
                  >
                    <AvatarImage src={selectedTopic.author_avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg font-bold">
                      {selectedTopic.author_name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isUserOnline(selectedTopic.author_last_seen) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{selectedTopic.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-2">
                      Автор: <button onClick={() => selectedTopic.author_id && onUserClick(selectedTopic.author_id)} className="hover:text-primary transition-colors">{selectedTopic.author_name}</button>
                      <ForumRoleBadge role={selectedTopic.author_forum_role} />
                    </span>
                    <span>•</span>
                    <span>{new Date(selectedTopic.created_at).toLocaleDateString('ru')}</span>
                    <span>•</span>
                    <span>{selectedTopic.views} просмотров</span>
                  </div>
                </div>
              </div>
              {selectedTopic.content && (
                <div className="prose prose-invert max-w-none mb-6 pb-6 border-b border-border">
                  <p className="text-foreground">{selectedTopic.content}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Комментарии ({topicComments.length})</h2>
            
            {user && (
              <div className="bg-card border border-border rounded-xl p-4">
                <Textarea
                  placeholder="Написать комментарий..."
                  value={newComment}
                  onChange={(e) => onCommentChange(e.target.value)}
                  className="mb-3 min-h-[100px]"
                />
                <Button onClick={onCreateComment} className="bg-primary">
                  Отправить
                </Button>
              </div>
            )}

            {topicComments.map((comment, index) => (
              <div key={comment.id} className="bg-card border border-border rounded-xl p-4 animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar 
                      className="w-10 h-10 cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => onUserClick(comment.author_id)}
                    >
                      <AvatarImage src={comment.author_avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-sm font-bold">
                        {comment.author_name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isUserOnline(comment.author_last_seen) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <button onClick={() => onUserClick(comment.author_id)} className="font-semibold hover:text-primary transition-colors">{comment.author_name}</button>
                      <ForumRoleBadge role={comment.author_forum_role} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('ru')} в {new Date(comment.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-foreground">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 animate-slide-up">
            <h1 className="text-3xl font-bold mb-2">Форум</h1>
            <p className="text-muted-foreground">
              {forumTopics.length} {forumTopics.length === 1 ? 'тема' : 'тем'}
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
              <Button onClick={onShowTopicDialog} className="bg-primary">
                <Icon name="Plus" size={18} className="mr-2" />
                Создать тему
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {forumTopics.map((topic, index) => (
              <div
                key={topic.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1" onClick={() => onTopicSelect(topic)}>
                    <div className="relative">
                      <Avatar 
                        className="w-10 h-10 hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          topic.author_id && onUserClick(topic.author_id);
                        }}
                      >
                        <AvatarImage src={topic.author_avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                          {topic.author_name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isUserOnline(topic.author_last_seen) && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {topic.is_pinned && (
                          <Badge variant="default" className="bg-primary">
                            <Icon name="Pin" size={12} className="mr-1" />
                            Закреплено
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate mb-1">
                        {topic.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-2">
                          Автор: <button onClick={(e) => { e.stopPropagation(); topic.author_id && onUserClick(topic.author_id); }} className="hover:text-primary transition-colors">{topic.author_name}</button>
                          <ForumRoleBadge role={topic.author_forum_role} />
                        </span>
                        <span>•</span>
                        <span>{new Date(topic.created_at).toLocaleDateString('ru')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Icon name="MessageCircle" size={14} />
                      <span>{topic.comments_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Eye" size={14} />
                      <span>{topic.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
};

export default MainContent;