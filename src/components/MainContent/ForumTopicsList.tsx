import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import UserRankBadge from '@/components/UserRankBadge';
import ForumRoleBadge from '@/components/ForumRoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ForumTopic, ForumCategory, User } from '@/types';
import { useState, useEffect } from 'react';
import { getAvatarGradient } from '@/utils/avatarColors';

interface ForumTopicsListProps {
  forumTopics: ForumTopic[];
  user: User | null;
  onShowTopicDialog: () => void;
  onTopicSelect: (topic: ForumTopic) => void;
  onUserClick: (userId: number) => void;
}

const isUserOnline = (lastSeenAt?: string) => {
  if (!lastSeenAt) return false;
  const lastSeen = new Date(lastSeenAt);
  if (isNaN(lastSeen.getTime())) return false;
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return diffMinutes < 5;
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'только что';
  if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;
  
  return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
};

const getFullDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';

export const ForumTopicsList = ({
  forumTopics,
  user,
  onShowTopicDialog,
  onTopicSelect,
  onUserClick
}: ForumTopicsListProps) => {
  const [forumSortBy, setForumSortBy] = useState<'newest' | 'hot' | 'views'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id.toString() || ''
        },
        body: JSON.stringify({
          action: 'get_categories'
        })
      });

      const data = await response.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const sortForumTopics = (topics: ForumTopic[]) => {
    const sorted = [...topics];
    if (forumSortBy === 'newest') {
      return sorted.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    if (forumSortBy === 'hot') {
      return sorted.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return (b.comments_count || 0) - (a.comments_count || 0);
      });
    }
    if (forumSortBy === 'views') {
      return sorted.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return (b.views || 0) - (a.views || 0);
      });
    }
    return sorted;
  };

  const filterTopicsBySearch = (topics: ForumTopic[]) => {
    if (!searchQuery.trim()) return topics;
    const query = searchQuery.toLowerCase();
    return topics.filter(topic => 
      topic.title.toLowerCase().includes(query) ||
      topic.content.toLowerCase().includes(query) ||
      topic.author_name.toLowerCase().includes(query)
    );
  };

  const filterTopicsByCategory = (topics: ForumTopic[]) => {
    if (!selectedCategory) return topics;
    return topics.filter(topic => topic.category_slug === selectedCategory);
  };

  const filteredTopics = sortForumTopics(filterTopicsByCategory(filterTopicsBySearch(forumTopics)));

  return (
    <>
      <div className="mb-3 sm:mb-4 md:mb-6 animate-slide-up">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Форум</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          {selectedCategory || searchQuery 
            ? `${filteredTopics.length} из ${forumTopics.length} ${forumTopics.length === 1 ? 'темы' : 'тем'}` 
            : `${forumTopics.length} ${forumTopics.length === 1 ? 'тема' : 'тем'}`
          }
        </p>
      </div>

      {/* Поиск - только на мобильных */}
      <div className="sm:hidden mb-3">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск по темам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
        <Tabs value={forumSortBy} onValueChange={(v) => setForumSortBy(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
            <TabsTrigger value="newest" className="text-[10px] sm:text-xs md:text-sm">Последние</TabsTrigger>
            <TabsTrigger value="hot" className="text-[10px] sm:text-xs md:text-sm">Горячие</TabsTrigger>
            <TabsTrigger value="views" className="text-[10px] sm:text-xs md:text-sm">Популярные</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {user && (
          <Button onClick={onShowTopicDialog} className="bg-primary w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10">
            <Icon name="Plus" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
            Создать тему
          </Button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-8 text-xs"
          >
            Все категории
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.slug ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.slug)}
              className="h-8 text-xs gap-1.5"
              style={{
                backgroundColor: selectedCategory === category.slug ? category.color : undefined,
                borderColor: category.color,
                color: selectedCategory === category.slug ? 'white' : category.color
              }}
            >
              <Icon name={category.icon as any} size={14} />
              {category.name}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filteredTopics.map((topic, index) => (
          <div
            key={topic.id}
            className="bg-card border border-border rounded-lg p-2.5 sm:p-3 md:p-4 hover:border-primary/50 transition-all duration-300 cursor-pointer group animate-slide-up hover:shadow-lg active:scale-[0.99] tap-highlight"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 w-full sm:w-auto" onClick={() => onTopicSelect(topic)}>
                <div className="relative">
                  <Avatar 
                    className="w-8 h-8 sm:w-10 sm:h-10 hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      topic.author_id && onUserClick(topic.author_id);
                    }}
                  >
                    <AvatarImage src={topic.author_avatar} />
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(topic.author_name)} text-white text-xs sm:text-sm font-bold`}>
                      {topic.author_name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-0.5 -right-0.5">
                    <UserRankBadge forumRole={topic.author_forum_role} size="sm" />
                  </div>
                  {isUserOnline(topic.author_last_seen) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {topic.is_pinned && (
                      <Badge variant="default" className="bg-primary">
                        <Icon name="Pin" size={12} className="mr-1" />
                        Закреплено
                      </Badge>
                    )}
                    {topic.category_name && topic.category_color && topic.category_icon && (
                      <Badge 
                        variant="outline" 
                        className="text-xs gap-1"
                        style={{
                          borderColor: topic.category_color,
                          color: topic.category_color,
                          backgroundColor: `${topic.category_color}10`
                        }}
                      >
                        <Icon name={topic.category_icon as any} size={12} />
                        {topic.category_name}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors truncate mb-1">
                    {topic.title}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      Автор: <button onClick={(e) => { e.stopPropagation(); topic.author_id && onUserClick(topic.author_id); }} className="hover:text-primary transition-colors">{topic.author_name}</button>
                      {topic.author_is_verified && (
                        <Icon name="BadgeCheck" size={14} className="text-primary" title="Верифицирован" />
                      )}
                      <ForumRoleBadge role={topic.author_forum_role} />
                    </span>
                    <span>•</span>
                    <span title={getFullDateTime(topic.created_at)}>Создана: {getTimeAgo(topic.created_at)}</span>
                    {topic.updated_at && topic.updated_at !== topic.created_at && (
                      <>
                        <span>•</span>
                        <span title={getFullDateTime(topic.updated_at)} className="flex items-center gap-1">
                          <Icon name="Clock" size={12} />
                          Обновлена: {getTimeAgo(topic.updated_at)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground flex-shrink-0 ml-10 sm:ml-0">
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
  );
};