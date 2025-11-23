import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { EscrowDeal, User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarGradient } from '@/utils/avatarColors';
import { useToast } from '@/hooks/use-toast';

const ESCROW_URL = 'https://functions.poehali.dev/82c75fbc-83e4-4448-9ff8-1c8ef9bbec09';

interface EscrowViewProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

export const EscrowView = ({ user, onShowAuthDialog, onRefreshUserBalance }: EscrowViewProps) => {
  const { toast } = useToast();
  const [deals, setDeals] = useState<EscrowDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<EscrowDeal | null>(null);
  const [statusFilter, setStatusFilter] = useState<'open' | 'completed' | 'dispute'>('open');
  
  const [newDeal, setNewDeal] = useState({
    title: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    fetchDeals();
    if (user) {
      checkDisputeNotifications();
    }
  }, [statusFilter, user]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkDisputeNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const checkDisputeNotifications = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${ESCROW_URL}?action=get_dispute_notifications`, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });
      const data = await response.json();
      
      if (data.notifications && data.notifications.length > 0) {
        data.notifications.forEach((notif: any) => {
          toast({
            title: 'Решение по спору',
            description: notif.message,
            duration: 10000
          });
        });

        await fetch(`${ESCROW_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify({
            action: 'mark_dispute_notifications_read'
          })
        });

        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
        fetchDeals();
      }
    } catch (error) {
      console.error('Ошибка проверки уведомлений:', error);
    }
  };

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ESCROW_URL}?action=list&status=${statusFilter}`);
      const data = await response.json();
      if (data.deals) {
        setDeals(data.deals);
      }
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    if (!newDeal.title || !newDeal.description || !newDeal.price) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'create_deal',
          title: newDeal.title,
          description: newDeal.description,
          price: parseFloat(newDeal.price)
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateDialog(false);
        setNewDeal({ title: '', description: '', price: '' });
        fetchDeals();
        toast({
          title: 'Успешно',
          description: 'Сделка создана!'
        });
      }
    } catch (error) {
      console.error('Ошибка создания сделки:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка создания сделки',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      open: { text: 'Открыта', variant: 'default' },
      in_progress: { text: 'В процессе', variant: 'secondary' },
      completed: { text: 'Завершена', variant: 'outline' },
      cancelled: { text: 'Отменена', variant: 'destructive' },
      dispute: { text: 'Спор', variant: 'destructive' }
    };
    const badge = badges[status] || badges.open;
    return <Badge variant={badge.variant}>{badge.text}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'border-green-800/50 hover:border-green-700/70',
      in_progress: 'border-blue-500/50 hover:border-blue-400/70',
      completed: 'border-gray-500/50 hover:border-gray-400/70',
      cancelled: 'border-red-500/50 hover:border-red-400/70',
      dispute: 'border-orange-500/50 hover:border-orange-400/70'
    };
    return colors[status] || colors.open;
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Гарант-сервис</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Безопасный обмен криптовалют с гарантией платформы
          </p>
        </div>
        <Button
          onClick={() => user ? setShowCreateDialog(true) : onShowAuthDialog()}
          className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
        >
          <Icon name="Plus" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
          Создать сделку
        </Button>
      </div>

      <Card className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-green-800/10 to-green-900/5 border-green-800/20">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-800/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="ShieldCheck" size={20} className="text-green-400 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Как это работает?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Мы блокируем криптовалюту покупателя до тех пор, пока он не получит свои монеты. Продавец получает оплату только после подтверждения покупателем. Это защищает обе стороны от обмана.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-400 flex items-center gap-2">
                <Icon name="Coins" size={18} />
                Продаю криптовалюту
              </h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-800/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-green-400">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Создаю объявление</p>
                    <p className="text-xs text-muted-foreground">
                      Указываю, какую криптовалюту меняю и курс
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-800/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-green-400">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Жду покупателя</p>
                    <p className="text-xs text-muted-foreground">
                      Покупатель блокирует USDT на платформе
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-800/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-green-400">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Отправляю монеты</p>
                    <p className="text-xs text-muted-foreground">
                      Перевожу криптовалюту покупателю
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-800/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-green-400">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Получаю USDT</p>
                    <p className="text-xs text-muted-foreground">
                      Покупатель подтверждает — деньги поступают
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-blue-400 flex items-center gap-2">
                <Icon name="ArrowRightLeft" size={18} />
                Покупаю криптовалюту
              </h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-400">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Выбираю обмен</p>
                    <p className="text-xs text-muted-foreground">
                      Нахожу выгодный курс обмена
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-400">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Блокирую USDT</p>
                    <p className="text-xs text-muted-foreground">
                      USDT замораживаются до получения монет
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-400">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Получаю монеты</p>
                    <p className="text-xs text-muted-foreground">
                      Продавец переводит криптовалюту
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-400">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Подтверждаю</p>
                    <p className="text-xs text-muted-foreground">
                      Если монеты пришли — USDT уходят продавцу
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <Icon name="AlertCircle" size={18} className="text-orange-400 flex-shrink-0 mt-0.5 sm:w-5 sm:h-5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-semibold text-orange-400">Что делать при проблеме?</p>
              <p className="text-muted-foreground">
                Если монеты не пришли или возникли проблемы — открывайте спор. Администрация разберётся и решит, кому вернуть средства.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {[
          { id: 'open', label: 'Открытые', icon: 'Clock' },
          { id: 'completed', label: 'Завершенные', icon: 'Check' },
          { id: 'dispute', label: 'Споры', icon: 'AlertTriangle' }
        ].map((filter) => (
          <Button
            key={filter.id}
            variant={statusFilter === filter.id ? 'default' : 'outline'}
            size="sm"
            className="text-xs sm:text-sm whitespace-nowrap"
            onClick={() => setStatusFilter(filter.id as any)}
            className={statusFilter === filter.id ? 'bg-green-800 hover:bg-green-700' : ''}
          >
            <Icon name={filter.icon as any} size={16} className="mr-2" />
            {filter.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : deals.length === 0 ? (
        <Card className="p-6 sm:p-8 md:p-12 text-center">
          <Icon name="Package" size={36} className="mx-auto mb-4 text-muted-foreground sm:w-12 sm:h-12" />
          <p className="text-muted-foreground">Сделок не найдено</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {deals.map((deal) => (
            <Card
              key={deal.id}
              className={`p-3 sm:p-4 transition-all cursor-pointer ${getStatusColor(deal.status)}`}
              onClick={() => setSelectedDeal(deal)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {deal.description}
                    </p>
                  </div>
                  {getStatusBadge(deal.status)}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                      <AvatarImage src={deal.seller_avatar} />
                      <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(deal.seller_name || '')} text-white text-xs`}>
                        {deal.seller_name?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{deal.seller_name}</p>
                      <p className="text-xs text-muted-foreground">Продавец</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-bold text-green-400">{deal.price} USDT</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(deal.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                {deal.buyer_id && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={deal.buyer_avatar} />
                      <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(deal.buyer_name || '')} text-white text-xs`}>
                        {deal.buyer_name?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">
                      Покупатель: <span className="font-medium text-foreground">{deal.buyer_name}</span>
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg p-0 gap-0 overflow-hidden">
          {/* Красивый градиентный заголовок */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-800/20 via-green-900/10 to-background border-b border-green-800/30 p-4 sm:p-5 md:p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center shadow-lg">
                  <Icon name="ShieldCheck" size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold">Создать обмен</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                    Безопасный обмен криптовалют с гарантией
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

          {/* Форма */}
          <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            {/* Название */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Icon name="ArrowRightLeft" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                Название обмена
              </Label>
              <Input
                value={newDeal.title}
                onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                placeholder="Например: BTC → USDT TRC20"
                className="text-sm sm:text-base h-10 sm:h-11"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Краткое название обмена (какую валюту меняете)
              </p>
            </div>

            {/* Описание */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Icon name="FileText" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                Описание
              </Label>
              <Textarea
                value={newDeal.description}
                onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                placeholder="Подробно опишите условия обмена...\n\nУкажите:\n• Какую криптовалюту отдаёте\n• Какую криптовалюту получите\n• Сеть и курс обмена"
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Чем подробнее описание, тем больше доверия
              </p>
            </div>

            {/* Цена */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Icon name="DollarSign" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                Цена (USDT)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={newDeal.price}
                  onChange={(e) => setNewDeal({ ...newDeal, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="text-sm sm:text-base h-10 sm:h-11 pl-10 font-mono"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Icon name="Coins" size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Покупатель заблокирует эту сумму до завершения сделки
              </p>
            </div>

            {/* Информационная карточка */}
            <Card className="bg-green-800/5 border-green-800/20 p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-800/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="Info" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium">Как работает гарант?</p>
                  <ul className="space-y-1 text-[10px] sm:text-xs text-muted-foreground">
                    <li className="flex items-start gap-1.5">
                      <Icon name="Check" size={12} className="mt-0.5 text-green-400 flex-shrink-0" />
                      <span>Покупатель блокирует USDT на платформе</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Icon name="Check" size={12} className="mt-0.5 text-green-400 flex-shrink-0" />
                      <span>Вы отправляете криптовалюту покупателю</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Icon name="Check" size={12} className="mt-0.5 text-green-400 flex-shrink-0" />
                      <span>Покупатель подтверждает получение монет</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Icon name="Check" size={12} className="mt-0.5 text-green-400 flex-shrink-0" />
                      <span>USDT поступают на ваш баланс</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Кнопки */}
          <div className="border-t border-border p-3 sm:p-4 md:p-5 bg-muted/30">
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 h-10 sm:h-11 text-xs sm:text-sm"
              >
                <Icon name="X" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                Отмена
              </Button>
              <Button
                onClick={createDeal}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 shadow-lg shadow-green-500/20 h-10 sm:h-11 text-xs sm:text-sm font-semibold"
              >
                <Icon name="ShieldCheck" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                Создать обмен
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedDeal && (
        <DealDetailDialog
          deal={selectedDeal}
          user={user}
          onClose={() => setSelectedDeal(null)}
          onUpdate={fetchDeals}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      )}
    </div>
  );
};

interface DealDetailDialogProps {
  deal: EscrowDeal;
  user: User | null;
  onClose: () => void;
  onUpdate: () => void;
  onRefreshUserBalance?: () => void;
}

const DealDetailDialog = ({ deal, user, onClose, onUpdate, onRefreshUserBalance }: DealDetailDialogProps) => {
  const { toast } = useToast();
  const [currentDeal, setCurrentDeal] = useState<EscrowDeal>(deal);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDealDetails();
    const interval = setInterval(fetchDealDetails, 3000);
    return () => clearInterval(interval);
  }, [deal.id]);

  const fetchDealDetails = async () => {
    try {
      const response = await fetch(`${ESCROW_URL}?action=deal&id=${deal.id}`);
      const data = await response.json();
      if (data.deal) {
        setCurrentDeal(data.deal);
      }
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    try {
      await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'send_message',
          deal_id: currentDeal.id,
          message: newMessage
        })
      });
      setNewMessage('');
      fetchDealDetails();
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const joinDeal = async () => {
    if (!user) return;
    
    // Проверка баланса перед присоединением
    if ((user.balance || 0) < currentDeal.price) {
      toast({
        title: 'Недостаточно средств',
        description: `У вас: ${(user.balance || 0).toFixed(2)} USDT, требуется: ${currentDeal.price} USDT. Пополните баланс для участия в сделке.`,
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'join_deal',
          deal_id: currentDeal.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Вы присоединились к сделке! Средства заблокированы до завершения.'
        });
        await fetchDealDetails();
        onUpdate();
        onRefreshUserBalance?.();
      } else if (data.error === 'Insufficient balance') {
        toast({
          title: 'Недостаточно средств',
          description: `Требуется: ${currentDeal.price} USDT. Пополните баланс для участия в сделке.`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка присоединения к сделке',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const buyerPaid = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const response = await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'buyer_paid',
          deal_id: currentDeal.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchDealDetails();
        onUpdate();
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const sellerConfirm = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const response = await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'seller_confirm',
          deal_id: currentDeal.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchDealDetails();
        onUpdate();
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const buyerConfirm = async () => {
    if (!user) return;
    
    const confirmed = window.confirm('Подтвердить получение товара? Средства будут переведены продавцу.');
    if (!confirmed) return;
    
    setLoading(true);

    try {
      const response = await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'buyer_confirm',
          deal_id: currentDeal.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: '🎉 Сделка успешно завершена!',
          description: 'Средства переведены продавцу. Спасибо за использование гарант-сервиса!',
          duration: 5000
        });
        await fetchDealDetails();
        onUpdate();
        onRefreshUserBalance?.();
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка завершения сделки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openDispute = async () => {
    if (!user) return;
    
    const reason = window.prompt('Укажите причину спора:');
    if (!reason || !reason.trim()) return;
    
    setLoading(true);

    try {
      const response = await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'open_dispute',
          deal_id: currentDeal.id,
          reason: reason.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Спор открыт',
          description: 'Администрация рассмотрит ситуацию и примет решение. Все сообщения в чате сохранены как доказательства.',
          duration: 5000
        });
        await fetchDealDetails();
        onUpdate();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка открытия спора',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const isSeller = user?.id === currentDeal.seller_id;
  const isBuyer = user?.id === currentDeal.buyer_id;
  const isAdmin = user?.role === 'admin';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Красивый градиентный заголовок */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-800/20 via-green-900/10 to-background border-b border-green-800/30 p-4 sm:p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg md:text-xl truncate pr-2">{currentDeal.title}</DialogTitle>
                <DialogDescription className="mt-1 text-xs sm:text-sm line-clamp-2">
                  {currentDeal.description}
                </DialogDescription>
              </div>
              <div className="flex-shrink-0">
                {currentDeal.status === 'open' && (
                  <Badge variant="default" className="bg-green-800 text-[10px] sm:text-xs">Открыта</Badge>
                )}
                {currentDeal.status === 'in_progress' && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">В процессе</Badge>
                )}
                {currentDeal.status === 'completed' && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">Завершена</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
          {currentDeal.status === 'completed' && (
            <Card className="p-3 sm:p-4 bg-gradient-to-r from-green-800/20 to-green-900/10 border-green-800/30">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-800/30 flex items-center justify-center flex-shrink-0">
                  <Icon name="CheckCircle2" size={20} className="text-green-400 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-green-400 text-sm sm:text-base">Сделка успешно завершена!</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                    {isSeller ? 'Средства зачислены на ваш баланс' : 'Монеты получены, средства переведены продавцу'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Card className="p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5">Продавец</p>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                  <AvatarImage src={currentDeal.seller_avatar} />
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(currentDeal.seller_name || '')} text-white text-xs`}>
                    {currentDeal.seller_name?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm sm:text-base truncate">{currentDeal.seller_name}</p>
              </div>
            </Card>

            <Card className="p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5">Цена</p>
              <p className="text-xl sm:text-2xl font-bold text-green-400">{currentDeal.price} USDT</p>
            </Card>
          </div>

          {currentDeal.buyer_id && (
            <Card className="p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5">Покупатель</p>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                  <AvatarImage src={currentDeal.buyer_avatar} />
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(currentDeal.buyer_name || '')} text-white text-xs`}>
                    {currentDeal.buyer_name?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm sm:text-base truncate">{currentDeal.buyer_name}</p>
              </div>
            </Card>
          )}

          <Card className="p-2 sm:p-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto bg-muted/30">
            <div className="space-y-1.5 sm:space-y-2">
              {messages.map((msg) => {
                const isAdminMessage = msg.user_role === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm ${
                      msg.is_system
                        ? 'bg-blue-500/10 border border-blue-500/20 text-center'
                        : isAdminMessage
                        ? 'bg-purple-500/10 border border-purple-500/30'
                        : msg.user_id === user?.id
                        ? 'bg-green-800/20 border border-green-800/30 ml-4 sm:ml-8'
                        : 'bg-card mr-4 sm:mr-8'
                    }`}
                  >
                    {!msg.is_system && (
                      <div className="flex items-center gap-1.5 mb-1 min-w-0">
                        <Avatar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                          <AvatarImage src={msg.avatar_url} />
                          <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(msg.username || '')} text-white text-[10px]`}>
                            {msg.username?.[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`text-[10px] sm:text-xs font-medium truncate ${isAdminMessage ? 'text-purple-400' : ''}`}>
                          {isAdminMessage && '👑 '}
                          {msg.username}
                          {isAdminMessage && ' (Админ)'}
                        </span>
                      </div>
                    )}
                    <p className={`break-words ${msg.is_system ? 'text-blue-400 font-medium' : isAdminMessage ? 'text-purple-300' : ''}`}>{msg.message}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      {new Date(msg.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {currentDeal.status !== 'completed' && currentDeal.status !== 'cancelled' && (isSeller || isBuyer || isAdmin) && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isAdmin ? "От администрации..." : "Сообщение..."}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="text-xs sm:text-sm h-9 sm:h-10"
              />
              <Button onClick={sendMessage} size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                <Icon name="Send" size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Button>
            </div>
          )}

          <div className="space-y-1.5 sm:space-y-2">
            {currentDeal.status === 'open' && !isSeller && (
              <Button
                onClick={joinDeal}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Icon name="ShoppingCart" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Купить за {currentDeal.price} USDT
              </Button>
            )}

            {currentDeal.status === 'in_progress' && isBuyer && !currentDeal.buyer_paid && (
              <Button
                onClick={buyerPaid}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Icon name="CreditCard" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Я отправил криптовалюту
              </Button>
            )}

            {currentDeal.status === 'in_progress' && isSeller && currentDeal.buyer_paid && !currentDeal.seller_confirmed && (
              <Button
                onClick={sellerConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Icon name="Package" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Монеты переданы покупателю
              </Button>
            )}

            {currentDeal.status === 'in_progress' && isBuyer && currentDeal.seller_confirmed && (
              <Button
                onClick={buyerConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Icon name="Check" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Подтвердить получение монет
              </Button>
            )}

            {currentDeal.status === 'in_progress' && (isSeller || isBuyer) && currentDeal.status !== 'dispute' && (
              <Button
                onClick={openDispute}
                disabled={loading}
                variant="destructive"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Icon name="AlertTriangle" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Открыть спор
              </Button>
            )}

            {currentDeal.status === 'dispute' && (
              <Card className="p-3 sm:p-4 bg-orange-500/10 border-orange-500/30">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Icon name="AlertTriangle" size={20} className="text-orange-400 flex-shrink-0 sm:w-6 sm:h-6" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-orange-400 text-sm sm:text-base">Спор открыт</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      Администрация рассматривает ситуацию. Все сообщения сохранены.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};