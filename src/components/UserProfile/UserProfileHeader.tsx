import { User } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ForumRoleBadge from '@/components/ForumRoleBadge';
import { getAvatarGradient } from '@/utils/avatarColors';

interface UserProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  animatedBalance: number;
  isBalanceChanging: boolean;
  avatarPreview: string | null;
  avatarUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAvatarSelect: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowTopUpDialog: () => void;
  onShowWithdrawalDialog: () => void;
}

export const UserProfileHeader = ({
  user,
  isOwnProfile,
  animatedBalance,
  isBalanceChanging,
  avatarPreview,
  avatarUploading,
  fileInputRef,
  onAvatarSelect,
  onFileChange,
  onShowTopUpDialog,
  onShowWithdrawalDialog
}: UserProfileHeaderProps) => {
  const getVipDaysLeft = () => {
    if (!user.vip_until) return 0;
    const now = new Date();
    const vipEnd = new Date(user.vip_until);
    if (vipEnd <= now) return 0;
    const diffTime = vipEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const vipDaysLeft = getVipDaysLeft();
  const hasActiveVip = vipDaysLeft > 0;

  const getMemberRoleTimeLeft = () => {
    if (user.forum_role !== 'new' || !user.created_at) return null;
    const createdAt = new Date(user.created_at);
    const memberRoleDate = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (now >= memberRoleDate) return null;
    
    const diffMs = memberRoleDate.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, date: memberRoleDate };
  };

  const memberRoleInfo = getMemberRoleTimeLeft();

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      {isOwnProfile ? (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 rounded-3xl" />
          <Card className="relative border-border/40 backdrop-blur-sm bg-background/95 shadow-xl">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative group cursor-pointer" onClick={onAvatarSelect}>
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary via-purple-500 to-blue-500 rounded-full opacity-75 blur-md group-hover:opacity-100 transition-opacity" />
                  <Avatar className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ring-4 ring-background">
                    <AvatarImage src={avatarPreview || user.avatar_url} />
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(user.username)} text-white text-2xl sm:text-3xl md:text-4xl font-bold`}>
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                    {avatarUploading ? (
                      <Icon name="Loader2" size={32} className="animate-spin text-white" />
                    ) : (
                      <Icon name="Camera" size={32} className="text-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-3 min-w-0 w-full">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                      <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                        {user.username}
                      </h3>
                      {user.is_verified && (
                        <Icon name="BadgeCheck" size={24} className="text-primary flex-shrink-0 sm:w-7 sm:h-7 drop-shadow-lg" title="Верифицирован" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    {user.role === 'admin' && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/40 text-red-400 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-red-500/10">
                        <Icon name="Shield" size={14} />
                        АДМИНИСТРАТОР
                      </span>
                    )}
                    
                    {user.forum_role && (
                      <ForumRoleBadge role={user.forum_role} />
                    )}
                    
                    {hasActiveVip && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
                        <Icon name="Crown" size={14} />
                        VIP ({vipDaysLeft}д)
                      </span>
                    )}
                    
                    {user.is_verified && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/40 text-primary rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-primary/10">
                        <Icon name="ShieldCheck" size={14} />
                        ВЕРИФИЦИРОВАН
                      </span>
                    )}
                  </div>

                  {user.bio && (
                    <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2 sm:line-clamp-3">{user.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative p-6 sm:p-8 md:p-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-br from-primary via-purple-500 to-blue-500 rounded-full opacity-75 blur-xl group-hover:opacity-100 transition-opacity animate-pulse" />
                <div className="relative">
                  <Avatar className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 ring-4 ring-background shadow-2xl">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(user.username)} text-white text-4xl sm:text-5xl md:text-6xl font-bold`}>
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.is_verified && (
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-full flex items-center justify-center ring-4 ring-background shadow-xl">
                      <Icon name="BadgeCheck" size={28} className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 max-w-2xl w-full">
                <div>
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-foreground via-primary to-purple-500 bg-clip-text text-transparent mb-3 break-words">
                    {user.username}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground/60 font-medium">Профиль участника сообщества</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5">
                  {user.role === 'admin' && (
                    <span className="px-4 py-2 bg-gradient-to-r from-red-500/30 to-red-600/30 border-2 border-red-500/50 text-red-400 rounded-xl text-sm font-black inline-flex items-center gap-2 shadow-xl shadow-red-500/20">
                      <Icon name="Shield" size={18} />
                      АДМИНИСТРАТОР
                    </span>
                  )}
                  
                  {user.forum_role && (
                    <div className="scale-110">
                      <ForumRoleBadge role={user.forum_role} />
                    </div>
                  )}
                  
                  {hasActiveVip && (
                    <span className="px-4 py-2 bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-orange-500/30 border-2 border-amber-500/50 text-amber-400 rounded-xl text-sm font-black inline-flex items-center gap-2 shadow-xl shadow-amber-500/20 animate-pulse">
                      <Icon name="Crown" size={18} />
                      VIP
                    </span>
                  )}
                  
                  {user.is_verified && (
                    <span className="px-4 py-2 bg-gradient-to-r from-primary/30 to-primary/20 border-2 border-primary/50 text-primary rounded-xl text-sm font-black inline-flex items-center gap-2 shadow-xl shadow-primary/20">
                      <Icon name="ShieldCheck" size={18} />
                      ВЕРИФИЦИРОВАН
                    </span>
                  )}
                </div>

                {user.bio && (
                  <Card className="p-4 sm:p-6 bg-background/60 backdrop-blur-sm border-border/50">
                    <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{user.bio}</p>
                  </Card>
                )}

                {(user.telegram || user.discord) && (
                  <Card className="p-4 sm:p-5 bg-background/60 backdrop-blur-sm border-border/50">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground mb-1">
                        <Icon name="Link" size={16} />
                        Контакты
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {user.telegram && (
                          <div className="flex items-center gap-2.5 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <Icon name="Send" size={18} className="text-blue-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-blue-400 truncate">{user.telegram}</span>
                          </div>
                        )}
                        {user.discord && (
                          <div className="flex items-center gap-2.5 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <Icon name="MessageSquare" size={18} className="text-purple-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-purple-400 truncate">{user.discord}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isOwnProfile && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-xl" />
          <Card className="relative bg-gradient-to-br from-green-950/40 via-emerald-950/40 to-green-950/40 border-green-700/30 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl" />
            <div className="relative p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-md opacity-75" />
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-2xl">
                      <Icon name="Wallet" size={28} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-green-400/80 font-medium mb-1">Ваш баланс</p>
                    <p className={`text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent transition-all duration-500 ${isBalanceChanging ? 'scale-110' : 'scale-100'}`}>
                      {Number(animatedBalance).toFixed(2)} <span className="text-xl sm:text-2xl">USDT</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={onShowTopUpDialog}
                    className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/40 transition-all hover:scale-105 active:scale-95 flex-1 sm:flex-none font-bold"
                  >
                    <Icon name="Plus" size={18} className="mr-2" />
                    Пополнить
                  </Button>
                  <Button 
                    onClick={onShowWithdrawalDialog}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 transition-all hover:scale-105 active:scale-95 flex-1 sm:flex-none font-bold"
                  >
                    <Icon name="ArrowDownToLine" size={18} className="mr-2" />
                    Вывод
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-400/60">
                <Icon name="Info" size={14} />
                <p>Используйте баланс для покупки товаров и услуг</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isOwnProfile && hasActiveVip && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-2xl opacity-30 group-hover:opacity-50 transition-opacity blur-xl" />
          <Card className="relative bg-gradient-to-br from-amber-950/40 via-yellow-950/40 to-orange-950/40 border-amber-500/40 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl" />
            <div className="relative p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl blur-md opacity-75 animate-pulse" />
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 flex items-center justify-center shadow-2xl">
                    <Icon name="Crown" size={24} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-amber-400 mb-1">VIP Привилегия активна</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-300/70">
                    <div className="flex items-center gap-1">
                      <Icon name="Clock" size={12} />
                      <span>Осталось: <span className="font-bold text-amber-400">{vipDaysLeft}д</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      <span>До: <span className="font-medium text-amber-300">{new Date(user.vip_until!).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isOwnProfile && memberRoleInfo && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-xl" />
          <Card className="relative bg-gradient-to-br from-blue-950/40 via-cyan-950/40 to-blue-950/40 border-blue-500/40 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl" />
            <div className="relative p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl blur-md opacity-75 animate-pulse" />
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl">
                    <Icon name="TrendingUp" size={24} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-blue-400 mb-1">Скоро повышение ранга!</p>
                  <p className="text-xs text-blue-300/70 mb-2">
                    Через <span className="font-bold text-blue-400">{memberRoleInfo.hours}ч {memberRoleInfo.minutes}м</span> → <span className="font-bold text-cyan-400">Участник форума</span>
                  </p>
                  <div className="flex items-start gap-1.5 text-xs text-blue-300/60">
                    <Icon name="Info" size={12} className="mt-0.5 flex-shrink-0" />
                    <span>С ролью "Участник" откроется доступ к играм</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};