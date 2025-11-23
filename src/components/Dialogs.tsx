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
import VerificationForm from '@/components/VerificationForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        <DialogContent className="animate-scale-in border-0 rounded-3xl shadow-2xl bg-card/95 backdrop-blur-xl max-w-md">
          <DialogHeader className="space-y-3 pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Icon name="Rocket" size={32} className="text-primary" />
            </div>
            <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {authMode === 'login' ? 'Добро пожаловать' : 'Регистрация'}
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              {authMode === 'login' ? 'Войдите, чтобы продолжить' : 'Создайте аккаунт за несколько секунд'}
            </p>
          </DialogHeader>

          {showResetPassword ? (
            <div className="space-y-5 pt-2">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground/80">
                  Введите email, указанный при регистрации. Мы отправим вам ссылку для сброса пароля.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/90">Email</label>
                <Input 
                  type="email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-11 rounded-xl border-border/50 focus:border-primary transition-all"
                  required 
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleResetPassword}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg shadow-primary/25"
                >
                  <Icon name="Mail" size={18} className="mr-2" />
                  Отправить ссылку
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail('');
                  }}
                  className="h-11 rounded-xl border-border/50 hover:bg-accent"
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onAuthSubmit} className="space-y-5 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/90">Имя пользователя</label>
                <Input 
                  name="username" 
                  required 
                  className="h-11 rounded-xl border-border/50 focus:border-primary transition-all"
                  placeholder="Введите имя пользователя"
                />
              </div>

              {authMode === 'register' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/90">Email</label>
                    <Input 
                      name="email" 
                      type="email" 
                      required 
                      className="h-11 rounded-xl border-border/50 focus:border-primary transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/90">
                      Реферальный код <span className="text-muted-foreground font-normal">(необязательно)</span>
                    </label>
                    <Input 
                      name="referral_code" 
                      placeholder="Введите код, если есть"
                      className="h-11 rounded-xl border-border/50 focus:border-primary transition-all uppercase"
                      maxLength={8}
                      defaultValue={savedRefCode}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/90">Пароль</label>
                <Input 
                  name="password" 
                  type="password" 
                  required 
                  className="h-11 rounded-xl border-border/50 focus:border-primary transition-all"
                  placeholder="Введите пароль"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
              >
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>

              <div className="space-y-3 pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">или</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => onAuthModeChange(authMode === 'login' ? 'register' : 'login')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center font-medium"
                >
                  {authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
                
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center font-medium"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Личный кабинет</DialogTitle>
          </DialogHeader>
          {user && (
            <div className="space-y-6 mt-6">
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
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">{user.username}</h3>
                    {user.is_verified && (
                      <Icon name="BadgeCheck" size={20} className="text-primary" title="Верифицирован" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                  <p className="text-xs text-red-500 mb-2 font-bold">DEBUG: Кнопки должны быть ниже ↓</p>
                  <div className="flex flex-col sm:flex-row gap-2 border-2 border-red-500 p-2 rounded">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full sm:w-auto"
                      onClick={handleAvatarSelect}
                      disabled={avatarUploading}
                    >
                      <Icon name="Upload" size={16} />
                      {avatarUploading ? 'Загрузка...' : 'Загрузить фото'}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2 w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
                      onClick={() => {
                        console.log('Verification button clicked');
                        const verificationSection = document.getElementById('verification-section');
                        console.log('Verification section:', verificationSection);
                        if (verificationSection) {
                          verificationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                    >
                      <Icon name="ShieldCheck" size={16} />
                      {user.is_verified ? '✓ Верифицирован' : 'Верификация'}
                    </Button>
                  </div>
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
              
              <div id="verification-section" className="pt-6 border-t">
                <VerificationForm user={user} onVerified={() => {
                  onUpdateProfile({ is_verified: true });
                }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dialogs;