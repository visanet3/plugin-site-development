import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import ForumRoleBadge from '@/components/ForumRoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ForumTopic, User } from '@/types';
import { useState } from 'react';
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
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
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

export const ForumTopicsList = ({
  forumTopics,
  user,
  onShowTopicDialog,
  onTopicSelect,
  onUserClick
}: ForumTopicsListProps) => {
  const [forumSortBy, setForumSortBy] = useState<'newest' | 'hot' | 'views'>('newest');

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

  return (
    <>
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-bold mb-2">Форум</h1>
        <p className="text-muted-foreground">
          {forumTopics.length} {forumTopics.length === 1 ? 'тема' : 'тем'}
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Tabs value={forumSortBy} onValueChange={(v) => setForumSortBy(v as any)}>
          <TabsList>
            <TabsTrigger value="newest">Последние посты</TabsTrigger>
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
        {sortForumTopics(forumTopics).map((topic, index) => (
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
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(topic.author_name)} text-white text-sm font-bold`}>
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
  );
};
