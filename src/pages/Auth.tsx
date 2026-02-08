import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { GradientBackground } from '@/components/ui/gradient-background';
import { ShinyButton } from '@/components/ui/shiny-button';

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
    console.log('[AUTH] Начало процесса авторизации');
    console.log('[AUTH] Режим:', authMode);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const email = formData.get('email') as string;
    const referralCode = formData.get('referral_code') as string;
    
    console.log('[AUTH] Данные формы:', {
      username,
      hasPassword: !!password,
      email: email || 'не указан',
      referralCode: referralCode || 'не указан',
    });
    
    // Валидация email при регистрации
    if (authMode === 'register' && email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('[AUTH] Ошибка валидации email:', email);
        toast({
          title: 'Ошибка',
          description: 'Введите корректный email',
          variant: 'destructive',
        });
        return;
      }
    }
    
    const requestBody = {
      action: authMode,
      username,
      password,
      email: authMode === 'register' ? email : undefined,
      referral_code: authMode === 'register' ? referralCode : undefined,
    };
    
    console.log('[AUTH] Отправка запроса на:', AUTH_URL);
    console.log('[AUTH] Тело запроса:', { ...requestBody, password: '***' });
    
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[AUTH] Ответ сервера - статус:', response.status);
      console.log('[AUTH] Ответ сервера - headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('[AUTH] Ответ сервера - данные:', data);

      if (response.ok) {
        console.log('[AUTH] Успешная авторизация');
        console.log('[AUTH] Токен получен:', !!data.token);
        console.log('[AUTH] Данные пользователя:', data.user);
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: 'Успешно!',
          description: authMode === 'login' ? 'Вы вошли в систему' : 'Аккаунт создан',
        });
        
        console.log('[AUTH] Переход на главную страницу');
        navigate('/');
      } else {
        console.error('[AUTH] Ошибка авторизации:', data.error || 'Неизвестная ошибка');
        toast({
          title: 'Ошибка',
          description: data.error || 'Что-то пошло не так',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[AUTH] Ошибка подключения к серверу:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    console.log('[RESET_PASSWORD] Начало процесса сброса пароля');
    console.log('[RESET_PASSWORD] Email:', resetEmail);
    
    if (!resetEmail) {
      console.log('[RESET_PASSWORD] Ошибка: email не указан');
      toast({
        title: 'Ошибка',
        description: 'Введите email',
        variant: 'destructive'
      });
      return;
    }

    const requestBody = { 
      action: 'request_reset',
      email: resetEmail 
    };
    
    console.log('[RESET_PASSWORD] Отправка запроса на:', PASSWORD_RESET_URL);
    console.log('[RESET_PASSWORD] Тело запроса:', requestBody);

    try {
      const response = await fetch(PASSWORD_RESET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[RESET_PASSWORD] Ответ сервера - статус:', response.status);
      
      const data = await response.json();
      console.log('[RESET_PASSWORD] Ответ сервера - данные:', data);

      if (response.ok) {
        console.log('[RESET_PASSWORD] Ссылка успешно отправлена');
        toast({
          title: 'Успешно!',
          description: 'Ссылка для сброса пароля отправлена на почту',
        });
        setShowResetPassword(false);
        setResetEmail('');
      } else {
        console.error('[RESET_PASSWORD] Ошибка:', data.error);
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить ссылку',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[RESET_PASSWORD] Ошибка подключения к серверу:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    }
  };

  return (
    <GradientBackground 
      blur="80px"
      overlay={true}
      overlayOpacity={0.5}
      animationDuration={12}
    >
      <div className="w-full max-w-6xl px-4 pt-20 sm:pt-16 pb-8 grid lg:grid-cols-2 gap-8 items-center overflow-y-auto lg:overflow-visible max-h-screen lg:max-h-none">
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Icon name="Sparkles" size={32} className="text-primary" />
              </div>
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
                  Git Crypto
                </h2>
                <p className="text-muted-foreground">Криптовалютная платформа</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-card/20 backdrop-blur-md rounded-2xl p-6 border border-border/20">
            <h3 className="text-xl font-semibold text-foreground">Что вас ждёт:</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon name="Zap" size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Flash USDT & BTC</h4>
                  <p className="text-sm text-muted-foreground">Криптовалюта для тестирования бирж и кошельков со скидками до 76%</p>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon name="ShieldCheck" size={20} className="text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Гарант-сервис</h4>
                  <p className="text-sm text-muted-foreground">Безопасные сделки между пользователями с защитой средств</p>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon name="ArrowLeftRight" size={20} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Обменник криптовалют</h4>
                  <p className="text-sm text-muted-foreground">Быстрый обмен между различными криптовалютами</p>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon name="Users" size={20} className="text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Реферальная программа</h4>
                  <p className="text-sm text-muted-foreground">Зарабатывайте на приглашении друзей и знакомых</p>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon name="MessageSquare" size={20} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Сообщество и поддержка</h4>
                  <p className="text-sm text-muted-foreground">Форум, чат и круглосуточная техническая поддержка</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 backdrop-blur-md rounded-2xl p-5 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="Shield" size={24} className="text-primary" />
              <h4 className="font-semibold text-foreground">Безопасность превыше всего</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Мы используем современные технологии шифрования и двухфакторную аутентификацию для защиты ваших данных и средств.
            </p>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-card/20 backdrop-blur-md rounded-2xl p-6 border border-border/20 relative overflow-hidden">
          <div className="auth-orbs-container rounded-2xl">
            <div className="auth-orb auth-orb-1"></div>
            <div className="auth-orb auth-orb-2"></div>
            <div className="auth-orb auth-orb-3"></div>
          </div>

          <div className="space-y-2 pb-5 relative z-10">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Icon name="Rocket" size={24} className="text-primary" />
            </div>
            <h1 className="text-center text-2xl font-bold auth-title-shimmer">
              {authMode === 'login' ? 'Добро пожаловать' : 'Регистрация'}
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              {authMode === 'login' ? 'Войдите, чтобы продолжить' : 'Создайте аккаунт за несколько секунд'}
            </p>
          </div>

          <div className="relative z-10">
            {showResetPassword ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
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
                    className="h-10 rounded-xl border-border/50 focus:border-primary transition-all"
                    required 
                  />
                </div>
                <div className="flex gap-3">
                  <ShinyButton 
                    onClick={handleResetPassword}
                    className="flex-1"
                  >
                    Отправить ссылку
                  </ShinyButton>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetEmail('');
                    }}
                    className="h-10 rounded-xl border-border/50 hover:bg-accent"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/90">Имя пользователя</label>
                  <Input 
                    name="username" 
                    required 
                    className="h-10 rounded-xl border-border/50 focus:border-primary transition-all"
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
                        className="h-10 rounded-xl border-border/50 focus:border-primary transition-all"
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
                        defaultValue={savedRefCode}
                        className="h-10 rounded-xl border-border/50 focus:border-primary transition-all"
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
                    className="h-10 rounded-xl border-border/50 focus:border-primary transition-all"
                    placeholder="Введите пароль"
                  />
                </div>

                <ShinyButton 
                  type="submit" 
                  className="w-full"
                >
                  {authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
                </ShinyButton>

                <div className="text-center space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-sm text-primary hover:underline transition-all"
                  >
                    {authMode === 'login' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
                  </button>
                  
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="block w-full text-sm text-muted-foreground hover:text-primary transition-all"
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
          </div>

          {/* Security Banner */}
          <div className="mt-6 bg-gradient-to-r from-red-600/20 via-red-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-5 border border-red-500/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <Icon name="ShieldAlert" size={20} className="text-red-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Icon name="ShieldCheck" size={16} className="text-red-400" />
                  Служба безопасности активна
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  На проекте активно работает служба безопасности для выявления и блокировки мошенников.
                </p>
                <p className="text-sm text-foreground">
                  Заметили подозрительную активность? Сообщите в поддержку:{' '}
                  <a 
                    href="https://t.me/gitcryptosupport" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-red-400 hover:text-red-300 font-semibold underline transition-colors"
                  >
                    @gitcryptosupport
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default Auth;