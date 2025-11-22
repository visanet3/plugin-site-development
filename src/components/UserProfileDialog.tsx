import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ForumRoleBadge from '@/components/ForumRoleBadge';

interface UserProfile {
  id: number;
  username: string;
  avatar_url?: string;
  bio?: string;
  vk_url?: string;
  telegram?: string;
  discord?: string;
  forum_role?: string;
  created_at: string;
  last_seen_at: string;
  topics_count: number;
  comments_count: number;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number | null;
  currentUserId?: number | null;
  onSendMessage?: (recipientId: number) => void;
}

const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';

const UserProfileDialog = ({ open, onOpenChange, userId, currentUserId, onSendMessage }: UserProfileDialogProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${ADMIN_URL}?action=user_profile&user_id=${userId}`);
      const data = await response.json();
      if (data.user) {
        setProfile({
          ...data.user,
          topics_count: data.topics_count || 0,
          comments_count: data.comments_count || 0
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getOnlineStatus = (lastSeenAt: string) => {
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

    if (diffMinutes < 5) {
      return { text: 'Онлайн', color: 'text-green-500', dot: 'bg-green-500' };
    }

    if (diffMinutes < 60) {
      return { text: `Был(а) в сети ${diffMinutes} мин. назад`, color: 'text-muted-foreground', dot: 'bg-gray-400' };
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return { text: `Был(а) в сети ${diffHours} ч. назад`, color: 'text-muted-foreground', dot: 'bg-gray-400' };
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return { text: 'Был(а) в сети вчера', color: 'text-muted-foreground', dot: 'bg-gray-400' };
    }

    if (diffDays < 7) {
      return { text: `Был(а) в сети ${diffDays} дн. назад`, color: 'text-muted-foreground', dot: 'bg-gray-400' };
    }

    return { text: `Был(а) в сети ${formatDate(lastSeenAt)}`, color: 'text-muted-foreground', dot: 'bg-gray-400' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Профиль пользователя</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">{profile.username}</h3>
                  {profile.forum_role && <ForumRoleBadge role={profile.forum_role} />}
                </div>

                {profile.last_seen_at && (() => {
                  const status = getOnlineStatus(profile.last_seen_at);
                  return (
                    <div className="flex items-center gap-2 mb-3" key={currentTime.getTime()}>
                      <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                      <span className={`text-sm ${status.color}`}>{status.text}</span>
                    </div>
                  );
                })()}
                
                {profile.bio && (
                  <p className="text-muted-foreground mb-3">{profile.bio}</p>
                )}
                
                <p className="text-sm text-muted-foreground">
                  На сайте с {formatDate(profile.created_at)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{profile.topics_count}</div>
                <div className="text-sm text-muted-foreground">Тем создано</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{profile.comments_count}</div>
                <div className="text-sm text-muted-foreground">Комментариев</div>
              </div>
            </div>

            {currentUserId && currentUserId !== profile.id && (
              <Button
                className="w-full gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onSendMessage?.(profile.id);
                }}
              >
                <Icon name="Mail" size={18} />
                Написать сообщение
              </Button>
            )}

            {(profile.vk_url || profile.telegram || profile.discord) && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Социальные сети</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.vk_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(profile.vk_url, '_blank')}
                    >
                      <Icon name="Link" size={16} />
                      VK
                    </Button>
                  )}
                  
                  {profile.telegram && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(`https://t.me/${profile.telegram.replace('@', '')}`, '_blank')}
                    >
                      <Icon name="Send" size={16} />
                      {profile.telegram}
                    </Button>
                  )}
                  
                  {profile.discord && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Icon name="MessageCircle" size={16} />
                      {profile.discord}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Пользователь не найден
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;