import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import GitCryptoLogo from '@/components/GitCryptoLogo';
import Icon from '@/components/ui/icon';

const PASSWORD_RESET_URL = 'https://functions.poehali.dev/d4973344-e5cd-411c-8957-4c1d4d0072ab';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      toast({
        title: 'Ошибка',
        description: 'Токен сброса пароля не найден',
        variant: 'destructive'
      });
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    setToken(tokenFromUrl);
    
    const validateToken = async () => {
      try {
        const response = await fetch(`${PASSWORD_RESET_URL}?token=${tokenFromUrl}`, {
          method: 'GET'
        });
        const data = await response.json();
        
        if (data.valid) {
          setTokenValid(true);
        } else {
          toast({
            title: 'Ошибка',
            description: data.error || 'Токен недействителен или истёк',
            variant: 'destructive'
          });
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Ошибка проверки токена',
          variant: 'destructive'
        });
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setValidating(false);
      }
    };
    
    validateToken();
  }, [searchParams, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен быть не менее 6 символов',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(PASSWORD_RESET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          token,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно!',
          description: 'Пароль успешно изменён. Перенаправляем на главную...'
        });
        setTimeout(() => navigate('/'), 2000);
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
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Проверка токена...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Токен недействителен. Перенаправление...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-background/95 backdrop-blur-xl border-2 border-primary/50 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Сброс пароля</h1>
          <p className="text-sm text-muted-foreground mt-2">Введите новый пароль</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Новый пароль</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Повторите пароль</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Check" size={16} className="mr-2" />
                Сохранить пароль
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/')}
          >
            Вернуться на главную
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;