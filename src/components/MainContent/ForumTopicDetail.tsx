import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import UserRankBadge from '@/components/UserRankBadge';
import ForumRoleBadge from '@/components/ForumRoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ForumTopic, ForumComment, User } from '@/types';
import { useState, useRef } from 'react';
import { getAvatarGradient } from '@/utils/avatarColors';

interface ForumTopicDetailProps {
  selectedTopic: ForumTopic;
  topicComments: ForumComment[];
  user: User | null;
  newComment: string;
  onBackToTopics: () => void;
  onCommentChange: (comment: string) => void;
  onCreateComment: (parentId?: number, attachment?: { url: string; filename: string; size: number; type: string }) => void;
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
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [mainAttachment, setMainAttachment] = useState<{ url: string; filename: string; size: number; type: string } | null>(null);
  const [replyAttachment, setReplyAttachment] = useState<{ url: string; filename: string; size: number; type: string } | null>(null);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingReply, setUploadingReply] = useState(false);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const buildCommentTree = (comments: ForumComment[]): ForumComment[] => {
    const commentMap = new Map<number, ForumComment>();
    const rootComments: ForumComment[] = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyContent('');
  };

  const handleSendReply = () => {
    if (replyContent.trim() && replyingTo) {
      onCreateComment(replyingTo, replyAttachment || undefined);
      setReplyingTo(null);
      setReplyContent('');
      setReplyAttachment(null);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
    setReplyAttachment(null);
  };

  const handleFileUpload = async (file: File, isReply: boolean) => {
    const setUploading = isReply ? setUploadingReply : setUploadingMain;
    const setAttachment = isReply ? setReplyAttachment : setMainAttachment;
    
    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        
        const response = await fetch('https://functions.poehali.dev/2bef49b4-3b41-4785-8bef-19bfef20ccd7', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            file_data: base64Data,
            filename: file.name,
            content_type: file.type
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setAttachment({
            url: data.url,
            filename: data.filename,
            size: data.size,
            type: data.content_type
          });
        } else {
          alert('Ошибка загрузки файла: ' + data.error);
        }
      };
    } catch (error) {
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  const renderComment = (comment: ForumComment, depth: number = 0) => (
    <div key={comment.id} className={depth > 0 ? 'ml-4 sm:ml-8 mt-2 sm:mt-3' : ''}>
      <div className="bg-card border border-border rounded-lg sm:rounded-xl p-2.5 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-4">
          <div className="relative flex-shrink-0">
            <Avatar 
              className="w-8 h-8 sm:w-10 sm:h-10 cursor-pointer hover:scale-110 transition-transform"
              onClick={() => comment.author_id && onUserClick(comment.author_id)}
            >
              <AvatarImage src={comment.author_avatar || undefined} />
              <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(comment.author_name)} text-white text-xs sm:text-sm font-bold`}>
                {comment.author_name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-0.5 -right-0.5 hidden sm:block">
              <UserRankBadge forumRole={comment.author_forum_role} size="sm" />
            </div>
            {isUserOnline(comment.author_last_seen) && (
              <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border border-background sm:border-2"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 flex-wrap">
              <button onClick={() => comment.author_id && onUserClick(comment.author_id)} className="font-semibold text-sm sm:text-base hover:text-primary transition-colors truncate">{comment.author_name}</button>
              {comment.author_is_verified && (
                <Icon name="BadgeCheck" size={14} className="text-primary flex-shrink-0 hidden sm:block" title="Верифицирован" />
              )}
              <div className="hidden sm:block">
                <ForumRoleBadge role={comment.author_forum_role} />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString('ru', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap mb-1.5 sm:mb-2">{comment.content}</p>
            {comment.attachment_url && comment.attachment_filename && (
              <div className="mt-2 mb-2">
                {comment.attachment_type?.startsWith('image/') ? (
                  <a href={comment.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
                    <img 
                      src={comment.attachment_url} 
                      alt={comment.attachment_filename}
                      className="max-w-full max-h-96 rounded-lg border border-border hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <a 
                    href={comment.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm"
                  >
                    <Icon name="Paperclip" size={16} />
                    <span className="truncate max-w-xs">{comment.attachment_filename}</span>
                    {comment.attachment_size && (
                      <span className="text-muted-foreground text-xs">({formatFileSize(comment.attachment_size)})</span>
                    )}
                  </a>
                )}
              </div>
            )}
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleReply(comment.id)}
                className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 sm:px-3"
              >
                <Icon name="Reply" size={12} className="mr-0.5 sm:mr-1 sm:w-3.5 sm:h-3.5" />
                Ответить
              </Button>
            )}
          </div>
        </div>

        {replyingTo === comment.id && (
          <div className="mt-2 sm:mt-3 ml-10 sm:ml-14 bg-muted/50 rounded-lg p-2 sm:p-3">
            <Textarea
              placeholder={`Ответ на комментарий ${comment.author_name}...`}
              value={replyContent}
              onChange={(e) => {
                setReplyContent(e.target.value);
                onCommentChange(e.target.value);
              }}
              className="min-h-[60px] sm:min-h-[80px] mb-2 text-sm"
            />
            {replyAttachment && (
              <div className="mb-2 p-2 bg-background rounded-lg border border-border flex items-center gap-2">
                <Icon name="Paperclip" size={14} />
                <span className="text-xs truncate flex-1">{replyAttachment.filename}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(replyAttachment.size)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyAttachment(null)}
                  className="h-6 w-6 p-0"
                >
                  <Icon name="X" size={12} />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={replyFileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => replyFileInputRef.current?.click()}
                disabled={uploadingReply || !!replyAttachment}
                className="h-8 text-xs"
              >
                <Icon name="Paperclip" size={12} className="mr-1" />
                {uploadingReply ? 'Загрузка...' : 'Файл'}
              </Button>
              <Button onClick={handleSendReply} disabled={!replyContent.trim()} size="sm" className="h-8 text-xs">
                <Icon name="Send" size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                Отправить
              </Button>
              <Button onClick={handleCancelReply} variant="ghost" size="sm" className="h-8 text-xs">
                Отмена
              </Button>
            </div>
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 sm:mt-3">
          {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  const commentTree = buildCommentTree(topicComments);
  return (
    <>
      <div className="mb-3 sm:mb-6 animate-slide-up">
        <Button variant="ghost" onClick={onBackToTopics} className="mb-2 sm:mb-4 h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4">
          <Icon name="ArrowLeft" size={16} className="mr-1 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
          Назад к темам
        </Button>
        <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-6 animate-scale-in">
          <div className="flex items-start gap-2 sm:gap-4 mb-3 sm:mb-6">
            <div className="relative flex-shrink-0">
              <Avatar 
                className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => selectedTopic.author_id && onUserClick(selectedTopic.author_id)}
              >
                <AvatarImage src={selectedTopic.author_avatar} />
                <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(selectedTopic.author_name)} text-white text-base sm:text-lg font-bold`}>
                  {selectedTopic.author_name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1 hidden sm:block">
                <UserRankBadge forumRole={selectedTopic.author_forum_role} size="sm" />
              </div>
              {isUserOnline(selectedTopic.author_last_seen) && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border border-background sm:border-2"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                {selectedTopic.parent_category_name && selectedTopic.parent_category_color && selectedTopic.parent_category_icon && (
                  <>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0 sm:py-0.5 h-5 sm:h-auto"
                      style={{
                        borderColor: selectedTopic.parent_category_color,
                        color: selectedTopic.parent_category_color,
                        backgroundColor: `${selectedTopic.parent_category_color}10`
                      }}
                    >
                      <Icon name={selectedTopic.parent_category_icon as any} size={12} className="sm:w-3.5 sm:h-3.5" />
                      {selectedTopic.parent_category_name}
                    </Badge>
                    <Icon name="ChevronRight" size={12} className="text-muted-foreground flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                  </>
                )}
                {selectedTopic.category_name && selectedTopic.category_color && selectedTopic.category_icon && (
                  <Badge 
                    variant="outline" 
                    className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0 sm:py-0.5 h-5 sm:h-auto"
                    style={{
                      borderColor: selectedTopic.category_color,
                      color: selectedTopic.category_color,
                      backgroundColor: `${selectedTopic.category_color}10`
                    }}
                  >
                    <Icon name={selectedTopic.category_icon as any} size={12} className="sm:w-3.5 sm:h-3.5" />
                    {selectedTopic.category_name}
                  </Badge>
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-bold mb-1.5 sm:mb-2">{selectedTopic.title}</h1>
              <div className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline">Автор:</span>
                  <button onClick={() => selectedTopic.author_id && onUserClick(selectedTopic.author_id)} className="hover:text-primary transition-colors">{selectedTopic.author_name}</button>
                  {selectedTopic.author_is_verified && (
                    <Icon name="BadgeCheck" size={14} className="text-primary hidden sm:block" title="Верифицирован" />
                  )}
                  <div className="hidden sm:block">
                    <ForumRoleBadge role={selectedTopic.author_forum_role} />
                  </div>
                </span>
                <span>•</span>
                <span>{new Date(selectedTopic.created_at).toLocaleDateString('ru')}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icon name="Eye" size={12} className="sm:hidden" />
                  <span className="hidden sm:inline">{selectedTopic.views} просмотров</span>
                  <span className="sm:hidden">{selectedTopic.views}</span>
                </span>
              </div>
            </div>
          </div>
          {selectedTopic.content && (
            <div className="prose prose-invert max-w-none mb-3 sm:mb-6 pb-3 sm:pb-6 border-b border-border">
              <p className="text-sm sm:text-base text-foreground">{selectedTopic.content}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 sm:space-y-4">
        <h2 className="text-base sm:text-xl font-bold">Комментарии ({topicComments.length})</h2>
        
        {user && !replyingTo && (
          <div className="bg-card border border-border rounded-lg sm:rounded-xl p-2.5 sm:p-4">
            <Textarea
              placeholder="Написать комментарий..."
              value={newComment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="min-h-[70px] sm:min-h-[100px] mb-2 sm:mb-3 text-sm sm:text-base"
            />
            {mainAttachment && (
              <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-muted rounded-lg border border-border flex items-center gap-2">
                <Icon name="Paperclip" size={16} />
                <span className="text-xs sm:text-sm truncate flex-1">{mainAttachment.filename}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">{formatFileSize(mainAttachment.size)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMainAttachment(null)}
                  className="h-7 w-7 p-0"
                >
                  <Icon name="X" size={14} />
                </Button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <input
                  ref={mainFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mainFileInputRef.current?.click()}
                  disabled={uploadingMain || !!mainAttachment}
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                >
                  <Icon name="Paperclip" size={14} className="mr-1 sm:mr-2" />
                  {uploadingMain ? 'Загрузка...' : 'Прикрепить файл'}
                </Button>
              </div>
              <Button onClick={() => { onCreateComment(undefined, mainAttachment || undefined); setMainAttachment(null); }} disabled={!newComment.trim()} className="h-8 sm:h-10 text-xs sm:text-sm">
                <Icon name="Send" size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                Отправить
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 sm:space-y-4">
          {commentTree.map((comment, index) => (
            <div 
              key={comment.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {renderComment(comment)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};