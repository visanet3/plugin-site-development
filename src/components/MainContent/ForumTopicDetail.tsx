import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import UserRankBadge from '@/components/UserRankBadge';
import ForumRoleBadge from '@/components/ForumRoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ForumTopic, ForumComment, User } from '@/types';
import { getAvatarGradient } from '@/utils/avatarColors';

interface ForumTopicDetailProps {
  selectedTopic: ForumTopic;
  topicComments: ForumComment[];
  user: User | null;
  newComment: string;
  onBackToTopics: () => void;
  onCommentChange: (comment: string) => void;
  onCreateComment: () => void;
  onUserClick: (userId: number) => void;
}

const isUserOnline = (lastSeenAt?: string) => {
  if (!lastSeenAt) return false;
  const lastSeen = new Date(lastSeenAt);
  if (isNaN(lastSeen.getTime())) return false;
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
  return diffMinutes < 5;
};

export const ForumTopicDetail = ({
  selectedTopic,
  topicComments,
  user,
  newComment,
  onBackToTopics,
  onCommentChange,
  onCreateComment,
  onUserClick
}: ForumTopicDetailProps) => {
  return (
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
                <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(selectedTopic.author_name)} text-white text-lg font-bold`}>
                  {selectedTopic.author_name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1">
                <UserRankBadge forumRole={selectedTopic.author_forum_role} size="sm" />
              </div>
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
              className="min-h-[100px] mb-3"
            />
            <div className="flex justify-end">
              <Button onClick={onCreateComment} disabled={!newComment.trim()}>
                <Icon name="Send" size={16} className="mr-2" />
                Отправить
              </Button>
            </div>
          </div>
        )}

        {topicComments.map((comment, index) => (
          <div 
            key={comment.id} 
            className="bg-card border border-border rounded-xl p-4 animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar 
                  className="w-10 h-10 cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => comment.author_id && onUserClick(comment.author_id)}
                >
                  <AvatarImage src={comment.author_avatar} />
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(comment.author_name)} text-white text-sm font-bold`}>
                    {comment.author_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-0.5 -right-0.5">
                  <UserRankBadge forumRole={comment.author_forum_role} size="sm" />
                </div>
                {isUserOnline(comment.author_last_seen) && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <button onClick={() => comment.author_id && onUserClick(comment.author_id)} className="font-semibold hover:text-primary transition-colors">{comment.author_name}</button>
                  <ForumRoleBadge role={comment.author_forum_role} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString('ru', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};