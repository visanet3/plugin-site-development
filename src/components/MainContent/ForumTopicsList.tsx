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
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${FORUM_URL}?action=get_categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
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
    if (selectedParentCategory !== null) {
      const parentCategory = categories.find(cat => cat.id === selectedParentCategory);
      if (parentCategory) {
        const allCategorySlugs = [
          parentCategory.slug,
          ...(parentCategory.subcategories || []).map(sub => sub.slug)
        ];
        return topics.filter(topic => allCategorySlugs.includes(topic.category_slug || ''));
      }
    }
    if (selectedCategory) {
      return topics.filter(topic => topic.category_slug === selectedCategory);
    }
    return topics;
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
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedParentCategory(null);
              }}
              className={`h-9 px-4 rounded-md text-sm font-medium transition-all border ${
                selectedCategory === null && selectedParentCategory === null
                  ? 'bg-zinc-700 text-zinc-100 border-zinc-600'
                  : 'bg-zinc-900/40 text-zinc-400 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              Все категории
            </button>
            
            {categories.map((parentCategory) => (
              <button
                key={parentCategory.id}
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedParentCategory(parentCategory.id);
                }}
                className="h-9 px-4 rounded-md text-sm font-medium transition-all flex items-center gap-2 border hover:brightness-110"
                style={{
                  backgroundColor: selectedParentCategory === parentCategory.id ? `${parentCategory.color}25` : `${parentCategory.color}12`,
                  borderColor: selectedParentCategory === parentCategory.id ? `${parentCategory.color}50` : `${parentCategory.color}30`,
                  color: selectedParentCategory === parentCategory.id ? parentCategory.color : `${parentCategory.color}cc`
                }}
              >
                <Icon name={parentCategory.icon as any} size={16} />
                {parentCategory.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filteredTopics.map((topic, index) => (
          <div
            key={topic.id}
            className="bg-zinc-900/40 border border-zinc-800/60 rounded-md p-2 sm:p-2.5 hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all duration-200 cursor-pointer group animate-slide-up active:scale-[0.99]"
            style={{ animationDelay: `${index * 0.03}s` }}
            onClick={() => onTopicSelect(topic)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <Avatar 
                    className="w-7 h-7 sm:w-8 sm:h-8 hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      topic.author_id && onUserClick(topic.author_id);
                    }}
                  >
                    <AvatarImage src={topic.author_avatar} />
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(topic.author_name)} text-white text-[10px] sm:text-xs font-bold`}>
                      {topic.author_name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isUserOnline(topic.author_last_seen) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-zinc-900"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    {topic.is_pinned && (
                      <Badge variant="default" className="h-4 px-1.5 text-[10px] bg-zinc-700 text-zinc-300">
                        <Icon name="Pin" size={10} className="mr-0.5" />
                        PIN
                      </Badge>
                    )}
                    {topic.category_name && topic.category_color && topic.category_icon && (
                      <Badge 
                        variant="outline" 
                        className="h-4 px-1.5 text-[10px] gap-1 border-zinc-700/50"
                        style={{
                          color: topic.category_color,
                          backgroundColor: `${topic.category_color}15`
                        }}
                      >
                        <Icon name={topic.category_icon as any} size={10} />
                        {topic.category_name}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-sm sm:text-base text-zinc-100 group-hover:text-zinc-50 transition-colors truncate mb-1 leading-snug">
                    {topic.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-500 flex-wrap">
                    <button 
                      onClick={(e) => { e.stopPropagation(); topic.author_id && onUserClick(topic.author_id); }} 
                      className="hover:text-zinc-400 transition-colors flex items-center gap-1"
                    >
                      {topic.author_name}
                      {topic.author_is_verified && (
                        <Icon name="BadgeCheck" size={11} className="text-emerald-500" />
                      )}
                    </button>
                    <span className="text-zinc-700">•</span>
                    <span title={getFullDateTime(topic.created_at)}>{getTimeAgo(topic.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-zinc-500 flex-shrink-0">
                <div className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
                  <Icon name="MessageCircle" size={13} />
                  <span>{topic.comments_count}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
                  <Icon name="Eye" size={13} />
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