import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { BeamsBackground } from '@/components/ui/beams-background';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const PASSWORD_RESET_URL = 'https://functions.poehali.dev/d4973344-e5cd-411c-8957-4c1d4d0072ab';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const savedRefCode = localStorage.getItem('referralCode') || '';

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          username: formData.get('username'),
          password: formData.get('password'),
          email: authMode === 'register' ? formData.get('email') : undefined,
          referral_code: authMode === 'register' ? formData.get('referral_code') : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: 'Успешно!',
          description: authMode === 'login' ? 'Вы вошли в систему' : 'Аккаунт создан',
        });
        
        navigate('/');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Что-то пошло не так',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
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
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Ссылка для сброса пароля отправлена на почту',
        });
        setShowResetPassword(false);
        setResetEmail('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить ссылку',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    }
  };

  return (
    <BeamsBackground intensity="medium">
      <div className="w-full max-w-md px-4">
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-border/50">
          <div className="auth-orbs-container">
            <div className="auth-orb auth-orb-1"></div>
            <div className="auth-orb auth-orb-2"></div>
            <div className="auth-orb auth-orb-3"></div>
          </div>

          <div className="space-y-3 pb-6 relative z-10">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center auth-icon-pulse">
              <Icon name="Rocket" size={40} className="text-primary auth-icon-float" />
            </div>
            <h1 className="text-center text-3xl font-bold auth-title-shimmer">
              {authMode === 'login' ? 'Добро пожаловать' : 'Регистрация'}
            </h1>
            <p className="text-center text-sm text-muted-foreground auth-fade-in">
              {authMode === 'login' ? 'Войдите, чтобы продолжить' : 'Создайте аккаунт за несколько секунд'}
            </p>
          </div>

          <div className="relative z-10">
            {showResetPassword ? (
              <div className="space-y-5 auth-slide-in">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 auth-glow">
                  <p className="text-sm text-foreground/80">
                    Введите email, указанный при регистрации. Мы отправим вам ссылку для сброса пароля.
                  </p>
                </div>
                <div className="space-y-2 auth-input-group">
                  <label className="text-sm font-medium text-foreground/90">Email</label>
                  <Input 
                    type="email" 
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-11 rounded-xl border-border/50 focus:border-primary transition-all auth-input-focus"
                    required 
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleResetPassword}
                    className="flex-1 h-11 rounded-xl auth-button-gradient text-white font-semibold shadow-lg shadow-primary/25"
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
              <form onSubmit={handleAuthSubmit} className="space-y-5 auth-slide-in">
                <div className="space-y-2 auth-input-group">
                  <label className="text-sm font-medium text-foreground/90">Имя пользователя</label>
                  <Input 
                    name="username" 
                    required 
                    className="h-11 rounded-xl border-border/50 focus:border-primary transition-all auth-input-focus"
                    placeholder="Введите имя пользователя"
                  />
                </div>

                {authMode === 'register' && (
                  <>
                    <div className="space-y-2 auth-input-group">
                      <label className="text-sm font-medium text-foreground/90">Email</label>
                      <Input 
                        name="email" 
                        type="email" 
                        required 
                        className="h-11 rounded-xl border-border/50 focus:border-primary transition-all auth-input-focus"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2 auth-input-group">
                      <label className="text-sm font-medium text-foreground/90">
                        Реферальный код <span className="text-muted-foreground font-normal">(необязательно)</span>
                      </label>
                      <Input 
                        name="referral_code" 
                        placeholder="Введите код, если есть"
                        defaultValue={savedRefCode}
                        className="h-11 rounded-xl border-border/50 focus:border-primary transition-all auth-input-focus"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 auth-input-group">
                  <label className="text-sm font-medium text-foreground/90">Пароль</label>
                  <Input 
                    name="password" 
                    type="password" 
                    required 
                    className="h-11 rounded-xl border-border/50 focus:border-primary transition-all auth-input-focus"
                    placeholder="Введите пароль"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-xl auth-button-gradient text-white font-semibold shadow-lg shadow-primary/25"
                >
                  <Icon name="LogIn" size={18} className="mr-2" />
                  {authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
                </Button>

                <div className="text-center space-y-3">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-sm text-primary hover:underline transition-all auth-link-hover"
                  >
                    {authMode === 'login' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
                  </button>
                  
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="block w-full text-sm text-muted-foreground hover:text-primary transition-all auth-link-hover"
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </BeamsBackground>
  );
};

export default Auth;
