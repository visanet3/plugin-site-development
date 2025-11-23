import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import UserRankBadge from '@/components/UserRankBadge';
import { getAvatarGradient } from '@/utils/avatarColors';

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
    
    if (isNaN(lastSeen.getTime())) {
      return { text: 'Был(а) давно', color: 'text-muted-foreground', dot: 'bg-gray-400' };
    }
    
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 5) {
      return { text: 'Онлайн', color: 'text-green-500', dot: 'bg-green-500' };
    }

    if (diffMinutes < 60) {
      return { text: `${diffMinutes} мин. назад`, color: 'text-muted-foreground', dot: 'bg-gray-400' };
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return { text: `${diffHours} ч. назад`, color: 'text-muted-foreground', dot: 'bg-gray-400' };
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return { text: 'вчера', color: 'text-muted-foreground', dot: 'bg-gray-400' };
    }

    if (diffDays < 7) {
      return { text: `${diffDays} дн. назад`, color: 'text-muted-foreground', dot: 'bg-gray-400' };
    }

    return { text: formatDate(lastSeenAt), color: 'text-muted-foreground', dot: 'bg-gray-400' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 gap-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Icon name="Loader2" size={32} className="animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="flex flex-col">
            {/* Шапка профиля с аватаром и именем */}
            <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background pt-8 pb-20 px-4">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-background shadow-lg">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(profile.username)} text-white text-3xl sm:text-4xl font-bold`}>
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute top-0 right-[-65px] sm:top-0 sm:right-[-75px]">
                    <UserRankBadge forumRole={profile.forum_role} size="lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Основная информация */}
            <div className="px-4 -mt-12 pb-4 space-y-4">
              <Card className="p-4 space-y-3">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">{profile.username}</h3>
                  
                  {profile.last_seen_at && (() => {
                    const status = getOnlineStatus(profile.last_seen_at);
                    return (
                      <div className="flex items-center justify-center gap-2 mb-2" key={currentTime.getTime()}>
                        <div className={`w-2 h-2 rounded-full ${status.dot} ${status.dot === 'bg-green-500' ? 'animate-pulse' : ''}`} />
                        <span className={`text-sm ${status.color}`}>{status.text}</span>
                      </div>
                    );
                  })()}
                </div>

                {profile.bio && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">{profile.bio}</p>
                  </div>
                )}
              </Card>

              {/* Статистика */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{profile.topics_count}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Тем</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{profile.comments_count}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Сообщений</div>
                </Card>
              </div>

              {/* Дата регистрации */}
              <Card className="p-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Calendar" size={16} />
                  <span>На сайте с {formatDate(profile.created_at)}</span>
                </div>
              </Card>

              {/* Социальные сети */}
              {(profile.vk_url || profile.telegram || profile.discord) && (
                <Card className="p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3 text-center">Социальные сети</h4>
                  <div className="flex flex-wrap justify-center gap-2">
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
                </Card>
              )}

              {/* Кнопка написать сообщение */}
              {currentUserId && currentUserId !== profile.id && (
                <Button
                  className="w-full gap-2 h-11"
                  onClick={() => {
                    onOpenChange(false);
                    onSendMessage?.(profile.id);
                  }}
                >
                  <Icon name="Mail" size={18} />
                  Написать сообщение
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Icon name="UserX" size={48} className="text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">Пользователь не найден</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;