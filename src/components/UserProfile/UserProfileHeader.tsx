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
  onShowTopUpDialog
}: UserProfileHeaderProps) => {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      <div className="flex items-start gap-6">
        <div className="relative group cursor-pointer" onClick={isOwnProfile ? onAvatarSelect : undefined}>
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarPreview || user.avatar_url} />
            <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(user.username)} text-white text-3xl font-bold`}>
              {user.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
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

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-2xl font-bold">{user.username}</h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          <div className="flex items-center gap-2">
            <ForumRoleBadge role={user.forum_role} />
            {user.role === 'admin' && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                Администратор
              </span>
            )}
          </div>

          {user.bio && (
            <p className="text-foreground/80 mt-2">{user.bio}</p>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <Card className="bg-gradient-to-br from-green-800/10 to-green-900/10 border-green-800/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
                <Icon name="Wallet" size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Баланс</p>
                <p className={`text-3xl font-bold transition-all duration-300 ${isBalanceChanging ? 'scale-110 text-green-400' : 'scale-100'}`}>
                  {Number(animatedBalance).toFixed(2)} USDT
                </p>
              </div>
            </div>
            <Button 
              onClick={onShowTopUpDialog}
              className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Пополнить
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Используйте баланс в USDT для покупки плагинов, премиум подписки и других услуг
          </p>
        </Card>
      )}
    </>
  );
};
