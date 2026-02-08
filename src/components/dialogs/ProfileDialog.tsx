import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarGradient } from '@/utils/avatarColors';
import { useToast } from '@/hooks/use-toast';
import VerificationForm from '@/components/VerificationForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AUTH_URL } from '@/lib/api-urls';

interface ProfileDialogProps {
  showProfileDialog: boolean;
  user: User | null;
  onProfileDialogChange: (open: boolean) => void;
  onUpdateProfile: (profileData: Partial<User>) => void;
}

export const ProfileDialog = ({
  showProfileDialog,
  user,
  onProfileDialogChange,
  onUpdateProfile,
}: ProfileDialogProps) => {
  const { toast } = useToast();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Выберите изображение',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 5 МБ',
        variant: 'destructive'
      });
      return;
    }

    setAvatarUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setAvatarPreview(base64);

        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify({
            action: 'upload_avatar',
            image: base64
          })
        });

        const data = await response.json();

        if (data.success) {
          onUpdateProfile({ avatar_url: data.avatar_url });
          const updatedUser = { ...user, avatar_url: data.avatar_url };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          toast({
            title: 'Успешно',
            description: 'Аватар обновлен!'
          });
        } else {
          toast({
            title: 'Ошибка',
            description: data.error || 'Ошибка загрузки',
            variant: 'destructive'
          });
          setAvatarPreview(null);
        }

        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка загрузки аватара',
        variant: 'destructive'
      });
      setAvatarUploading(false);
      setAvatarPreview(null);
    }
  };

  if (!user) return null;

  const gradient = getAvatarGradient(user.username);
  const displayAvatar = avatarPreview || user.avatar_url;

  return (
    <Dialog open={showProfileDialog} onOpenChange={onProfileDialogChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Icon name="User" size={28} className="text-primary" />
            Личный кабинет
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <Icon name="User" size={16} className="mr-2" />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="balance">
              <Icon name="Wallet" size={16} className="mr-2" />
              Баланс
            </TabsTrigger>
            <TabsTrigger value="verification">
              <Icon name="ShieldCheck" size={16} className="mr-2" />
              Верификация
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            <div className="flex flex-col items-center gap-4 pb-6 border-b">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-primary/20 transition-all group-hover:border-primary/40">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className={`text-3xl font-bold ${gradient}`}>
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarSelect}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {avatarUploading ? (
                    <Icon name="Loader2" size={20} className="animate-spin" />
                  ) : (
                    <Icon name="Camera" size={20} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold">{user.username}</h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID пользователя</label>
                <Input value={user.id} disabled className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Роль</label>
                <Input value={user.role === 'admin' ? 'Администратор' : 'Пользователь'} disabled className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Дата регистрации</label>
                <Input 
                  value={user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'} 
                  disabled 
                  className="mt-1" 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="balance" className="space-y-6 mt-6">
            <div className="grid gap-4">
              <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Текущий баланс</p>
                    <p className="text-4xl font-bold">{Number(user.balance).toFixed(2)} USDT</p>
                  </div>
                  <div className="p-4 rounded-full bg-primary/10">
                    <Icon name="Wallet" size={32} className="text-primary" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button className="h-14 text-base" size="lg">
                  <Icon name="Plus" size={20} className="mr-2" />
                  Пополнить
                </Button>
                <Button variant="outline" className="h-14 text-base" size="lg">
                  <Icon name="ArrowUpRight" size={20} className="mr-2" />
                  Вывести
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Icon name="History" size={18} />
                  История транзакций
                </h4>
                <p className="text-sm text-muted-foreground">История транзакций пока пуста</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            <VerificationForm user={user} onUpdateProfile={onUpdateProfile} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};