import { User } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import UserRankBadge from '@/components/UserRankBadge';
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

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
        <div className="relative group cursor-pointer" onClick={isOwnProfile ? onAvatarSelect : undefined}>
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
            <AvatarImage src={avatarPreview || user.avatar_url} />
            <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(user.username)} text-white text-xl sm:text-2xl md:text-3xl font-bold`}>
              {user.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
            <UserRankBadge forumRole={user.forum_role} size="sm" />
          </div>
          {isOwnProfile && (
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {avatarUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : (
                <Icon name="Camera" size={28} className="text-white" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{user.username}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.role === 'admin' && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-red-500/20 text-red-400 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1">
                <Icon name="Shield" size={14} />
                Администратор
              </span>
            )}
            
            {hasActiveVip && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1">
                <Icon name="Crown" size={14} />
                VIP {isOwnProfile && `(${vipDaysLeft} ${vipDaysLeft === 1 ? 'день' : vipDaysLeft < 5 ? 'дня' : 'дней'})`}
              </span>
            )}
          </div>

          {user.bio && (
            <p className="text-xs sm:text-sm text-foreground/80 mt-2 line-clamp-3">{user.bio}</p>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <Card className="bg-gradient-to-br from-green-800/10 to-green-900/10 border-green-800/20 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
                <Icon name="Wallet" size={20} className="text-white sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Баланс</p>
                <p className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 ${isBalanceChanging ? 'scale-110 text-green-400' : 'scale-100'}`}>
                  {Number(animatedBalance).toFixed(2)} USDT
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={onShowTopUpDialog}
                className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Icon name="Plus" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Пополнить
              </Button>
              <Button 
                onClick={onShowWithdrawalDialog}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/20 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Icon name="ArrowDownToLine" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Вывод
              </Button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Используйте баланс в USDT для покупки товаров
          </p>
        </Card>
      )}

      {isOwnProfile && hasActiveVip && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Icon name="Crown" size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-amber-400 mb-1">VIP Привилегия активна</p>
              <p className="text-xs text-muted-foreground">
                Осталось: <span className="font-semibold text-foreground">{vipDaysLeft} {vipDaysLeft === 1 ? 'день' : vipDaysLeft < 5 ? 'дня' : 'дней'}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                До: <span className="font-medium">{new Date(user.vip_until!).toLocaleDateString('ru-RU')}</span>
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};