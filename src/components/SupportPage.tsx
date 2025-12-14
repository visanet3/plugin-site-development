import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { triggerNotificationUpdate } from '@/utils/notificationEvents';

interface SupportPageProps {
  user: User | null;
  onShowAuthDialog: () => void;
}

const TICKETS_URL = 'https://functions.poehali.dev/f2a5cbce-6afc-4ef1-91a6-f14075db8567';

const SupportPage = ({ user, onShowAuthDialog }: SupportPageProps) => {
  const { toast } = useToast();
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'account', label: 'Проблемы с аккаунтом', icon: 'User' },
    { value: 'payment', label: 'Вопросы по платежам', icon: 'CreditCard' },
    { value: 'exchange', label: 'Обменник', icon: 'ArrowLeftRight' },
    { value: 'smart_contracts', label: 'Смарт-контракты', icon: 'FileCode' },
    { value: 'flash_btc', label: 'Flash BTC', icon: 'Bitcoin' },
    { value: 'games', label: 'Игры', icon: 'Gamepad2' },
    { value: 'garant', label: 'Гарант сделка', icon: 'Shield' },
    { value: 'flash', label: 'Flash USDT', icon: 'Zap' },
    { value: 'complaint', label: 'Жалобы, обман', icon: 'AlertTriangle' },
    { value: 'forum', label: 'Проблемы с форумом', icon: 'MessageSquare' },
    { value: 'technical', label: 'Технические проблемы', icon: 'Settings' },
    { value: 'other', label: 'Другое', icon: 'HelpCircle' }
  ];

  const createTicket = async () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    if (!category) {
      toast({
        title: 'Ошибка',
        description: 'Выберите категорию проблемы',
        variant: 'destructive'
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(TICKETS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'create',
          user_id: user.id,
          username: user.username,
          category: category,
          subject: subject.trim(),
          message: message.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Тикет создан!',
          description: 'Мы получили ваше обращение и ответим в ближайшее время'
        });
        triggerNotificationUpdate(user.id, user.role);
        
        setCategory('');
        setSubject('');
        setMessage('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать тикет',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка создания тикета:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать тикет',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">💬 Техническая поддержка</h1>
        <p className="text-muted-foreground">
          Опишите вашу проблему, и мы поможем вам в ближайшее время
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-6 text-center">
          <Icon name="Clock" size={32} className="mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2">Время ответа</h3>
          <p className="text-sm text-muted-foreground">
            От 3 минут до 2 часов в зависимости от сложности проблемы
          </p>
        </Card>
        <Card className="p-6 text-center">
          <Icon name="Headphones" size={32} className="mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2">Поддержка 24/7</h3>
          <p className="text-sm text-muted-foreground">
            Работаем круглосуточно без выходных
          </p>
        </Card>
        <Card className="p-6 text-center">
          <Icon name="Shield" size={32} className="mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2">Безопасность</h3>
          <p className="text-sm text-muted-foreground">
            Ваши данные защищены и конфиденциальны
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">
              Категория проблемы *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all flex items-center gap-2 sm:gap-3 text-sm ${
                    category === cat.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon name={cat.icon as any} size={20} />
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-2">
              Тема обращения *
            </label>
            <Input
              id="subject"
              type="text"
              placeholder="Кратко опишите проблему"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {subject.length}/100 символов
            </p>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Подробное описание *
            </label>
            <Textarea
              id="message"
              placeholder="Опишите вашу проблему максимально подробно. Укажите, что вы делали, какая ошибка возникла, прикрепите скриншоты если возможно..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              maxLength={2000}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/2000 символов
            </p>
          </div>

          {!user && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Требуется авторизация</p>
                  <p className="text-muted-foreground">
                    Войдите в аккаунт, чтобы создать тикет в поддержку
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              disabled={isSubmitting || !user}
              className="flex-1"
              onClick={createTicket}
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={18} className="animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" size={18} />
                  Отправить тикет
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCategory('');
                setSubject('');
                setMessage('');
              }}
              disabled={isSubmitting}
            >
              Очистить
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 bg-card/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="Lightbulb" size={20} className="text-yellow-400" />
          Советы для быстрого решения
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• <strong>Проверьте FAQ:</strong> возможно, ответ на ваш вопрос уже есть в разделе FAQ</p>
          <p>• <strong>Укажите детали:</strong> чем подробнее описание, тем быстрее мы найдем решение</p>
          <p>• <strong>Приложите скриншоты:</strong> визуальные материалы помогают понять проблему</p>
          <p>• <strong>Укажите устройство:</strong> какой браузер и операционную систему вы используете</p>
          <p>• <strong>Проверьте email:</strong> ответ придет на почту, указанную при регистрации</p>
        </div>
      </Card>
    </div>
  );
};

export default SupportPage;