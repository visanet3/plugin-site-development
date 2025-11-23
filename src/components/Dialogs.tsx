import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarGradient } from '@/utils/avatarColors';
import { useToast } from '@/hooks/use-toast';

interface DialogsProps {
  authDialogOpen: boolean;
  authMode: 'login' | 'register';
  showTopicDialog: boolean;
  showProfileDialog: boolean;
  user: User | null;
  newTopicTitle: string;
  newTopicContent: string;
  onAuthDialogChange: (open: boolean) => void;
  onAuthModeChange: (mode: 'login' | 'register') => void;
  onAuthSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onTopicDialogChange: (open: boolean) => void;
  onTopicTitleChange: (title: string) => void;
  onTopicContentChange: (content: string) => void;
  onCreateTopic: () => void;
  onProfileDialogChange: (open: boolean) => void;
  onUpdateProfile: (profileData: Partial<User>) => void;
  onAuthDialogAttemptClose?: () => void;
}

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const PASSWORD_RESET_URL = 'https://functions.poehali.dev/d4973344-e5cd-411c-8957-4c1d4d0072ab';

const Dialogs = ({
  authDialogOpen,
  authMode,
  showTopicDialog,
  showProfileDialog,
  user,
  newTopicTitle,
  newTopicContent,
  onAuthDialogChange,
  onAuthModeChange,
  onAuthSubmit,
  onTopicDialogChange,
  onTopicTitleChange,
  onTopicContentChange,
  onCreateTopic,
  onProfileDialogChange,
  onUpdateProfile,
  onAuthDialogAttemptClose,
}: DialogsProps) => {
  const { toast } = useToast();
  const savedRefCode = localStorage.getItem('referralCode') || '';
  
  const handleAuthDialogChange = (open: boolean) => {
    if (!open && !user) {
      if (onAuthDialogAttemptClose) {
        onAuthDialogAttemptClose();
      }
      return;
    }
    onAuthDialogChange(open);
  };
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

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

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите email',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(PASSWORD_RESET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_reset',
          email: resetEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Письмо отправлено',
          description: 'Проверьте вашу почту. Мы отправили ссылку для сброса пароля.',
          duration: 10000
        });
        setShowResetPassword(false);
        setResetEmail('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка сброса пароля',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <Dialog open={authDialogOpen} onOpenChange={handleAuthDialogChange}>
        <DialogContent className="animate-scale-in border-0">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">{authMode === 'login' ? 'Добро пожаловать' : 'Регистрация'}</DialogTitle>
          </DialogHeader>

          {showResetPassword ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Введите email, указанный при регистрации. Мы отправим вам ссылку для сброса пароля.</p>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input 
                  type="email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  required 
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleResetPassword}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Icon name="Mail" size={16} className="mr-2" />
                  Отправить ссылку
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail('');
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onAuthSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Имя пользователя</label>
                <Input name="username" required />
              </div>

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email</label>
                    <Input name="email" type="email" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Реферальный код <span className="text-muted-foreground font-normal">(необязательно)</span>
                    </label>
                    <Input 
                      name="referral_code" 
                      placeholder="Введите код, если есть"
                      className="uppercase"
                      maxLength={8}
                      defaultValue={savedRefCode}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Пароль</label>
                <Input name="password" type="password" required />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onAuthModeChange(authMode === 'login' ? 'register' : 'login')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  {authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
                
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                  >
                    Забыли пароль?
                  </button>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showTopicDialog} onOpenChange={onTopicDialogChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Создать новую тему</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1 block">Название темы</label>
              <Input 
                value={newTopicTitle} 
                onChange={(e) => onTopicTitleChange(e.target.value)}
                placeholder="Введите название темы"
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1 block">Описание</label>
              <Textarea 
                value={newTopicContent}
                onChange={(e) => onTopicContentChange(e.target.value)}
                className="min-h-[120px] sm:min-h-[150px] text-sm sm:text-base"
                placeholder="Опишите вашу тему..."
              />
            </div>
            <Button onClick={onCreateTopic} className="w-full bg-primary text-sm sm:text-base">
              Создать тему
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={onProfileDialogChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Личный кабинет</DialogTitle>
          </DialogHeader>
          {user && (
            <div className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={handleAvatarSelect}>
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarPreview || user.avatar_url} />
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(user.username)} text-white text-2xl`}>
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {avatarUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <Icon name="Camera" size={24} className="text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{user.username}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleAvatarSelect}
                    disabled={avatarUploading}
                  >
                    <Icon name="Upload" size={16} />
                    {avatarUploading ? 'Загрузка...' : 'Загрузить фото'}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">О себе</label>
                  <Textarea 
                    defaultValue={user.bio || ''}
                    onBlur={(e) => onUpdateProfile({ bio: e.target.value })}
                    className="min-h-[100px]"
                    placeholder="Расскажите о себе..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                      <Icon name="MessageCircle" size={16} />
                      VK
                    </label>
                    <Input 
                      defaultValue={user.vk_url || ''}
                      onBlur={(e) => onUpdateProfile({ vk_url: e.target.value })}
                      placeholder="https://vk.com/..."
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                      <Icon name="Send" size={16} />
                      Telegram
                    </label>
                    <Input 
                      defaultValue={user.telegram || ''}
                      onBlur={(e) => onUpdateProfile({ telegram: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                      <Icon name="MessageSquare" size={16} />
                      Discord
                    </label>
                    <Input 
                      defaultValue={user.discord || ''}
                      onBlur={(e) => onUpdateProfile({ discord: e.target.value })}
                      placeholder="username#1234"
                    />
                  </div>
                  

                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dialogs;