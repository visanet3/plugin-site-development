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
  is_verified?: boolean;
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
      <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Icon name="Loader2" size={32} className="animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="flex flex-col">
            {/* Hero section с градиентами */}
            <div className="relative overflow-hidden">
              {/* Тонкий градиентный фон */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-muted/10 to-background" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-muted/10 rounded-full blur-3xl" />
              
              <div className="relative p-6 sm:p-8 md:p-10">
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* Большой аватар с деликатным свечением */}
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-primary/20 rounded-full opacity-50 blur-lg group-hover:opacity-75 transition-opacity" />
                    <div className="relative">
                      <Avatar className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 ring-4 ring-background shadow-2xl">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(profile.username)} text-white text-4xl sm:text-5xl md:text-6xl font-bold`}>
                          {profile.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {profile.is_verified && (
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-full flex items-center justify-center ring-4 ring-background shadow-xl">
                          <Icon name="BadgeCheck" size={28} className="text-white" />
                        </div>
                      )}
                      {/* Роль пользователя справа сверху */}
                      {profile.forum_role && (
                        <div className="absolute -top-2 -right-6 sm:-right-8 scale-110 sm:scale-125">
                          <UserRankBadge forumRole={profile.forum_role} size="lg" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 max-w-2xl w-full">
                    {/* Стильное имя без градиента */}
                    <div>
                      <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-3 break-words">
                        {profile.username}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground/70 font-medium">Профиль участника сообщества</p>
                    </div>

                    {/* Статус онлайн */}
                    {profile.last_seen_at && (() => {
                      const status = getOnlineStatus(profile.last_seen_at);
                      return (
                        <div className="flex items-center justify-center gap-2" key={currentTime.getTime()}>
                          <div className={`w-3 h-3 rounded-full ${status.dot} ${status.dot === 'bg-green-500' ? 'animate-pulse' : ''}`} />
                          <span className={`text-sm font-semibold ${status.color}`}>{status.text}</span>
                        </div>
                      );
                    })()}



                    {/* Био */}
                    {profile.bio && (
                      <Card className="p-4 sm:p-6 bg-background/60 backdrop-blur-sm border-border/50">
                        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{profile.bio}</p>
                      </Card>
                    )}

                    {/* Статистика в плитках */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-4 sm:p-5 bg-background/60 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all">
                        <div className="text-3xl sm:text-4xl font-black text-primary mb-2">{profile.topics_count}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground font-medium">Тем создано</div>
                      </Card>
                      <Card className="p-4 sm:p-5 bg-background/60 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all">
                        <div className="text-3xl sm:text-4xl font-black text-primary mb-2">{profile.comments_count}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground font-medium">Сообщений</div>
                      </Card>
                    </div>

                    {/* Дата регистрации */}
                    <Card className="p-3 sm:p-4 bg-background/60 backdrop-blur-sm border-border/50">
                      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Icon name="Calendar" size={16} />
                        <span>На сайте с <span className="font-semibold text-foreground">{formatDate(profile.created_at)}</span></span>
                      </div>
                    </Card>

                    {/* Контакты */}
                    {(profile.telegram || profile.discord) && (
                      <Card className="p-4 sm:p-5 bg-background/60 backdrop-blur-sm border-border/50">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground mb-1">
                            <Icon name="Link" size={16} />
                            Контакты
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {profile.telegram && (
                              <div 
                                className="flex items-center gap-2.5 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg cursor-pointer hover:bg-blue-500/20 transition-all"
                                onClick={() => window.open(`https://t.me/${profile.telegram.replace('@', '')}`, '_blank')}
                              >
                                <Icon name="Send" size={18} className="text-blue-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-blue-400 truncate">{profile.telegram}</span>
                              </div>
                            )}
                            {profile.discord && (
                              <div className="flex items-center gap-2.5 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                <Icon name="MessageSquare" size={18} className="text-purple-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-purple-400 truncate">{profile.discord}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Кнопка написать сообщение */}
                    {currentUserId && currentUserId !== profile.id && (
                      <Button
                        className="w-full gap-2 h-12 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all font-semibold text-base"
                        onClick={() => {
                          onOpenChange(false);
                          onSendMessage?.(profile.id);
                        }}
                      >
                        <Icon name="Mail" size={20} />
                        Написать сообщение
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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