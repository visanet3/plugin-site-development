import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Deal, User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarGradient } from '@/utils/avatarColors';
import { useToast } from '@/hooks/use-toast';
import { triggerUserSync } from '@/utils/userSync';
import { DealDialogMobile } from '@/components/DealDialogMobile';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  
  return isDesktop;
};

const DEALS_URL = 'https://functions.poehali.dev/8a665174-b0af-4138-82e0-a9422dbb8fc4';

interface DealsViewProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

export const DealsView = ({ user, onShowAuthDialog, onRefreshUserBalance }: DealsViewProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [dealMessages, setDealMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<'active' | 'my_deals' | 'completed'>('active');
  
  const [newDeal, setNewDeal] = useState({
    title: '',
    description: '',
    price: ''
  });

  const fetchDealsRef = useRef<number | null>(null);
  const lastFetchParams = useRef<{statusFilter: string, userId: number | null}>({ statusFilter: '', userId: null });
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const currentParams = { statusFilter, userId: user?.id || null };
    
    if (lastFetchParams.current.statusFilter === currentParams.statusFilter && 
        lastFetchParams.current.userId === currentParams.userId) {
      return;
    }
    
    if (isFetchingRef.current) {
      return;
    }
    
    lastFetchParams.current = currentParams;
    
    if (fetchDealsRef.current) {
      clearTimeout(fetchDealsRef.current);
    }
    
    fetchDealsRef.current = window.setTimeout(() => {
      isFetchingRef.current = true;
      fetchDeals().finally(() => {
        isFetchingRef.current = false;
      });
    }, 150);
    
    return () => {
      if (fetchDealsRef.current) {
        clearTimeout(fetchDealsRef.current);
      }
    };
  }, [statusFilter, user?.id, fetchDeals]);

  const selectedDealIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (selectedDeal && selectedDeal.id !== selectedDealIdRef.current) {
      selectedDealIdRef.current = selectedDeal.id;
      fetchDealDetails(selectedDeal.id);
    }
  }, [selectedDeal?.id, fetchDealDetails]);



  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(DEALS_URL);
      url.searchParams.set('action', 'list');
      url.searchParams.set('status', statusFilter);
      
      const headers: HeadersInit = {};
      if (user && statusFilter !== 'active') {
        headers['X-User-Id'] = user.id.toString();
      }
      
      const response = await fetch(url.toString(), { headers });
      const data = await response.json();
      if (data.deals) {
        setDeals(data.deals);
      }
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, user]);

  const fetchDealDetails = useCallback(async (dealId: number) => {
    try {
      const headers: HeadersInit = {};
      if (user) {
        headers['X-User-Id'] = user.id.toString();
      }
      
      const response = await fetch(`${DEALS_URL}?action=deal&id=${dealId}`, { headers });
      const data = await response.json();
      if (data.deal) {
        setSelectedDeal(data.deal);
        setDealMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей сделки:', error);
    }
  }, [user]);

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

    if (creating) return;
    setCreating(true);

    try {
      const response = await fetch(DEALS_URL, {
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
        toast({
          title: 'Успешно',
          description: 'Объявление создано!'
        });
        setStatusFilter('my_deals');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка создания объявления',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка создания сделки:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка создания объявления',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleBuyerPay = async () => {
    if (!user || !selectedDeal) return;
    if (actionLoading) return;
    
    if ((user.balance || 0) < selectedDeal.price) {
      toast({
        title: 'Недостаточно средств',
        description: `У вас: ${(user.balance || 0).toFixed(2)} USDT, требуется: ${selectedDeal.price} USDT`,
        variant: 'destructive'
      });
      return;
    }
    
    setActionLoading(true);

    try {
      const response = await fetch(DEALS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'buyer_pay',
          deal_id: selectedDeal.id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: '✅ Успешно',
          description: 'Средства заблокированы. Ожидайте передачи товара от продавца',
          duration: 5000
        });
        
        // Обновляем баланс через 5 секунд после успешной блокировки средств
        setTimeout(() => {
          triggerUserSync();
          onRefreshUserBalance?.();
        }, 5000);
        
        await fetchDealDetails(selectedDeal.id);
        setStatusFilter('my_deals');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка оплаты',
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
      setActionLoading(false);
    }
  };

  const handleSellerSent = async () => {
    if (!user || !selectedDeal || actionLoading) return;
    setActionLoading(true);

    try {
      const response = await fetch(DEALS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'seller_sent',
          deal_id: selectedDeal.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Отлично!',
          description: 'Покупатель уведомлен. Ожидайте подтверждения получения'
        });
        await fetchDealDetails(selectedDeal.id);
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyerConfirm = async () => {
    if (!user || !selectedDeal || actionLoading) return;
    setShowConfirmDialog(true);
  };

  const confirmBuyerConfirm = async () => {
    if (!user || !selectedDeal || actionLoading) return;
    
    setShowConfirmDialog(false);
    setActionLoading(true);

    try {
      const response = await fetch(DEALS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'buyer_confirm',
          deal_id: selectedDeal.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: '🎉 Сделка завершена!',
          description: 'Средства переведены продавцу',
          duration: 5000
        });
        
        // Обновляем баланс через 5 секунд после завершения сделки
        setTimeout(() => {
          triggerUserSync();
          onRefreshUserBalance?.();
        }, 5000);
        
        await fetchDealDetails(selectedDeal.id);
        setStatusFilter('completed');
        
        setTimeout(() => {
          setSelectedDeal(null);
        }, 2000);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка завершения сделки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка завершения сделки',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || !selectedDeal) return;

    try {
      await fetch(DEALS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'send_message',
          deal_id: selectedDeal.id,
          message: newMessage
        })
      });
      setNewMessage('');
      fetchDealDetails(selectedDeal.id);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const getStepText = (step: string, isSeller: boolean) => {
    const steps: Record<string, { seller: string; buyer: string }> = {
      waiting_buyer: {
        seller: '📢 Ожидание покупателя',
        buyer: '🛒 Вы можете купить этот товар'
      },
      seller_sending: {
        seller: '💰 Покупатель оплатил. Передайте товар',
        buyer: '⏳ Ожидайте передачи товара от продавца'
      },
      buyer_confirming: {
        seller: '📦 Ожидайте подтверждения от покупателя',
        buyer: '✅ Проверьте товар и подтвердите получение'
      },
      completed: {
        seller: '✅ Сделка завершена',
        buyer: '✅ Сделка завершена'
      }
    };
    const step_data = steps[step] || steps.waiting_buyer;
    return isSeller ? step_data.seller : step_data.buyer;
  };

  const getStatusBadge = (deal: Deal) => {
    if (deal.status === 'completed') {
      return <Badge variant="outline" className="text-xs">Завершена</Badge>;
    }
    if (deal.status === 'in_progress') {
      return <Badge variant="secondary" className="text-xs">В процессе</Badge>;
    }
    return <Badge variant="default" className="bg-green-800 text-xs">Активна</Badge>;
  };

  return (
    <div className="space-y-3 sm:space-y-6 animate-fade-in">
      {!isDesktop && (
        <Card className="p-3 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="Monitor" size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-400 mb-1">💻 Доступно только на ПК</p>
              <p className="text-xs text-muted-foreground/80">
                Создание и просмотр сделок доступны только с компьютера для вашей безопасности
              </p>
            </div>
          </div>
        </Card>
      )}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-600/10 via-emerald-600/5 to-green-700/10 border-green-600/30">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
              <Icon name="Shield" size={24} className="text-white sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Как работает Гарант-сервис?</h2>
              <p className="text-sm text-muted-foreground">
                Надежная защита ваших средств при сделках с другими пользователями
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-4 bg-background/60 border-green-600/20">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-400">1</span>
                </div>
                <Icon name="FileText" size={32} className="text-green-400" />
                <h3 className="font-bold text-sm">Создание сделки</h3>
                <p className="text-xs text-muted-foreground">
                  Продавец создает объявление с описанием товара и ценой
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-background/60 border-blue-600/20">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-400">2</span>
                </div>
                <Icon name="Lock" size={32} className="text-blue-400" />
                <h3 className="font-bold text-sm">Блокировка средств</h3>
                <p className="text-xs text-muted-foreground">
                  Покупатель оплачивает. Средства блокируются на платформе
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-background/60 border-purple-600/20">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-400">3</span>
                </div>
                <Icon name="Package" size={32} className="text-purple-400" />
                <h3 className="font-bold text-sm">Передача товара</h3>
                <p className="text-xs text-muted-foreground">
                  Продавец передает товар и нажимает "Товар передан"
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-background/60 border-emerald-600/20">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-400">4</span>
                </div>
                <Icon name="CheckCircle" size={32} className="text-emerald-400" />
                <h3 className="font-bold text-sm">Завершение</h3>
                <p className="text-xs text-muted-foreground">
                  Покупатель подтверждает получение. Средства переводятся продавцу
                </p>
              </div>
            </Card>
          </div>

          <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-bold text-amber-400">Важные правила безопасности:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Комиссия сервиса: 3% от суммы сделки (удерживается с продавца)</li>
                  <li>• Средства блокируются до завершения сделки - никто не может их забрать</li>
                  <li>• Используйте чат для общения с другой стороной</li>
                  <li>• Если возникли проблемы - обратитесь в поддержку через спор</li>
                  <li>• Продавец получает деньги только после подтверждения покупателя</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-800/5 via-emerald-800/5 to-green-900/5 border-green-700/20">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
            <Icon name="Plus" size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Хотите продать через гарант?</h3>
            <p className="text-sm text-muted-foreground">
              Создайте объявление и получите деньги безопасно
            </p>
          </div>
          <Button
            onClick={() => {
              if (!isDesktop) {
                toast({
                  title: '💻 Доступно только на ПК',
                  description: 'Гарант-сервис доступен только с компьютера из-за некорректной работы мобильных браузеров',
                  variant: 'destructive',
                  duration: 5000
                });
                return;
              }
              user ? setShowCreateDialog(true) : onShowAuthDialog();
            }}
            className="bg-gradient-to-r from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 h-11 px-8 text-base font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-800/50 active:scale-95 touch-manipulation"
          >
            <Icon name="Plus" size={18} className="mr-2" />
            Разместить объявление
            {!isDesktop && <Icon name="Monitor" size={16} className="ml-2" />}
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'active', label: 'Активные', icon: 'Store' },
          { id: 'my_deals', label: 'Мои сделки', icon: 'ShoppingCart' },
          { id: 'completed', label: 'Завершенные', icon: 'Check' }
        ].map((filter) => (
          <Button
            key={filter.id}
            variant={statusFilter === filter.id ? 'default' : 'outline'}
            className={`whitespace-nowrap h-8 sm:h-9 text-xs sm:text-sm transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation ${statusFilter === filter.id ? 'bg-green-800 hover:bg-green-700 shadow-lg shadow-green-800/30' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter(filter.id as any)}
          >
            <Icon name={filter.icon as any} size={14} className="mr-1.5 sm:mr-2" />
            {filter.label}
          </Button>
        ))}
      </div>

      {statusFilter !== 'active' && !user && (
        <Card className="p-2.5 sm:p-3 bg-orange-500/5 border-orange-500/20">
          <p className="text-xs sm:text-sm text-orange-400 flex items-center gap-2">
            <Icon name="Lock" size={14} className="sm:w-4 sm:h-4" />
            <span>Войдите, чтобы увидеть свои сделки</span>
          </p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground sm:w-8 sm:h-8" />
        </div>
      ) : deals.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center space-y-2 sm:space-y-3">
          <Icon name="Package" size={36} className="mx-auto mb-3 sm:mb-4 text-muted-foreground sm:w-12 sm:h-12" />
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            {statusFilter === 'active' && 'Нет активных объявлений'}
            {statusFilter === 'my_deals' && 'У вас нет активных сделок'}
            {statusFilter === 'completed' && 'У вас нет завершенных сделок'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal) => (
            <Card
              key={deal.id}
              className={`p-4 transition-all duration-300 touch-manipulation ${
                isDesktop
                  ? 'cursor-pointer hover:border-green-700/70 hover:shadow-xl hover:shadow-green-800/20 hover:scale-[1.02] active:scale-[0.98]'
                  : 'cursor-not-allowed border-muted-foreground/20'
              }`}
              onClick={() => {
                if (!isDesktop) {
                  toast({
                    title: '💻 Доступно только на ПК',
                    description: 'Просмотр и участие в сделках доступны только с компьютера',
                    variant: 'destructive'
                  });
                  return;
                }
                setSelectedDeal(deal);
                setShowDealDialog(true);
                fetchDealDetails(deal.id);
              }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg truncate">{deal.title}</h3>
                  {getStatusBadge(deal)}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {deal.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={deal.seller_avatar} />
                      <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(deal.seller_name || '')} text-white text-xs`}>
                        {deal.seller_name?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-xs">
                      <p className="font-medium">{deal.seller_name}</p>
                      <p className="text-muted-foreground">Продавец</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-xl font-bold text-green-400">{deal.price} USDT</p>
                    {!isDesktop && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon name="Monitor" size={12} />
                        <span>Только ПК</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог создания объявления */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Разместить объявление</DialogTitle>
            <DialogDescription>
              Создайте объявление о продаже через гарант-сервис
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newDeal.title}
                onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                placeholder="Например: Bitcoin 0.01 BTC"
                className="transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={newDeal.description}
                onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                placeholder="Подробное описание товара..."
                className="min-h-[100px] resize-none transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
              />
            </div>

            <div className="space-y-2">
              <Label>Цена (USDT)</Label>
              <Input
                type="number"
                value={newDeal.price}
                onChange={(e) => setNewDeal({ ...newDeal, price: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
              />
            </div>

            <Card className="bg-blue-500/5 border-blue-500/20 p-3">
              <p className="text-xs text-blue-400">
                ℹ️ После успешного завершения сделки с вас будет удержана комиссия 3%
              </p>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCreateDialog(false);
                }}
                className="flex-1 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation"
                type="button"
              >
                Отмена
              </Button>
              <Button
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!creating) {
                    createDeal();
                  }
                }}
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-800 touch-manipulation transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-green-700/50 disabled:opacity-50 disabled:hover:scale-100"
                type="button"
              >
                <Icon name={creating ? "Loader2" : "Plus"} size={16} className={`mr-2 ${creating ? 'animate-spin' : ''}`} />
                {creating ? 'Создаем...' : 'Создать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог детальной сделки */}
      {selectedDeal && showDealDialog && (
        <>
          {/* Мобильная версия */}
          {isMobile ? (
            <DealDialogMobile
              deal={selectedDeal}
              user={user}
              dealMessages={dealMessages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessage={sendMessage}
              actionLoading={actionLoading}
              onClose={() => {
                setShowDealDialog(false);
                setSelectedDeal(null);
              }}
              getStepText={getStepText}
              handleBuyerPay={handleBuyerPay}
              handleSellerSent={handleSellerSent}
              handleBuyerConfirm={handleBuyerConfirm}
            />
          ) : (
          /* Desktop версия */
          <Dialog open={showDealDialog} onOpenChange={(open) => {
            setShowDealDialog(open);
            if (!open) {
              setSelectedDeal(null);
            }
          }}>
            <DialogContent className="w-[90vw] max-w-3xl h-[80vh] overflow-hidden flex flex-col p-5 rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedDeal.title}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
                  {selectedDeal.description}
                </DialogDescription>
              </DialogHeader>

            <div className="flex-1 flex flex-col space-y-2 sm:space-y-2.5 min-h-0 overflow-hidden">
              {user && (Number(user.id) === Number(selectedDeal.seller_id) || Number(user.id) === Number(selectedDeal.buyer_id)) && (
                <Card className="p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <Icon name={Number(user.id) === Number(selectedDeal.seller_id) ? "Store" : "ShoppingCart"} size={14} className="text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-blue-300">
                        {Number(user.id) === Number(selectedDeal.seller_id) ? 'Вы - продавец' : 'Вы - покупатель'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 truncate leading-tight">
                        {getStepText(selectedDeal.step, Number(user.id) === Number(selectedDeal.seller_id))}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2 flex-shrink-0">
                <Card className="p-2 sm:p-2.5 bg-gradient-to-br from-green-500/10 to-green-600/15 border-green-500/30 shadow-lg hover:shadow-green-500/20 transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 sm:gap-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/40 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <Icon name="Store" size={14} className="text-green-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-xs text-muted-foreground/70 mb-0.5 font-medium">Продавец</p>
                      <div className="flex items-center gap-1">
                        <Avatar className="w-4 h-4 sm:w-5 sm:h-5 ring-1 ring-green-500/30">
                          <AvatarImage src={selectedDeal.seller_avatar} />
                          <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(selectedDeal.seller_name)} text-white text-[8px]`}>
                            {selectedDeal.seller_name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-bold text-[10px] sm:text-xs truncate text-green-300">{selectedDeal.seller_name}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-2 sm:p-2.5 bg-gradient-to-br from-amber-500/10 to-yellow-600/15 border-amber-500/30 shadow-lg hover:shadow-amber-500/20 transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 sm:gap-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-600/40 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <Icon name="DollarSign" size={16} className="text-amber-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-xs text-muted-foreground/70 mb-0.5 font-medium">Сумма</p>
                      <p className="text-sm sm:text-lg font-black text-amber-300 truncate leading-tight">
                        {selectedDeal.price}
                        <span className="text-[9px] sm:text-xs text-muted-foreground/60 ml-0.5 font-semibold">USDT</span>
                      </p>
                    </div>
                  </div>
                </Card>

                {selectedDeal.buyer_id ? (
                  <Card className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500/10 to-blue-600/15 border-blue-500/30 shadow-lg hover:shadow-blue-500/20 transition-all backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 sm:gap-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/40 flex items-center justify-center flex-shrink-0 shadow-inner">
                        <Icon name="ShoppingCart" size={14} className="text-blue-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-xs text-muted-foreground/70 mb-0.5 font-medium">Покупатель</p>
                        <div className="flex items-center gap-1">
                          <Avatar className="w-4 h-4 sm:w-5 sm:h-5 ring-1 ring-blue-500/30">
                            <AvatarImage src={selectedDeal.buyer_avatar} />
                            <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(selectedDeal.buyer_name || '')} text-white text-[8px]`}>
                              {selectedDeal.buyer_name?.[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-bold text-[10px] sm:text-xs truncate text-blue-300">{selectedDeal.buyer_name}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-2 sm:p-2.5 bg-gradient-to-br from-gray-500/10 to-gray-600/15 border-gray-500/30 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 sm:gap-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-500/30 to-gray-600/40 flex items-center justify-center flex-shrink-0 shadow-inner">
                        <Icon name="UserX" size={14} className="text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] sm:text-xs text-muted-foreground/70 mb-0.5 font-medium">Покупатель</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-semibold">Ожидается</p>
                      </div>
                    </div>
                  </Card>
                )}
                <Card className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500/10 to-indigo-600/15 border-purple-500/30 shadow-lg hover:shadow-purple-500/20 transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 sm:gap-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-600/40 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <Icon name="Clock" size={14} className="text-purple-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-xs text-muted-foreground/70 mb-0.5 font-medium">Статус</p>
                      <p className="text-[10px] sm:text-xs font-bold text-purple-300 truncate capitalize">
                        {selectedDeal.status === 'active' ? 'Активна' : selectedDeal.status === 'in_progress' ? 'В процессе' : selectedDeal.status === 'completed' ? 'Завершена' : 'Отменена'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-2 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border-indigo-500/30 shadow-lg flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <Icon name="CalendarClock" size={12} className="text-indigo-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-muted-foreground/70 mb-0.5">Создана</p>
                      <p className="text-[10px] sm:text-xs font-semibold text-indigo-300 truncate">
                        {new Date(selectedDeal.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <Icon name="Hash" size={12} className="text-teal-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-muted-foreground/70 mb-0.5">ID сделки</p>
                      <p className="text-[10px] sm:text-xs font-mono font-bold text-teal-300 truncate">#{selectedDeal.id}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Чат */}
              <Card className="p-2 sm:p-3 flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-muted/30 to-muted/10 border-border/50 shadow-inner">
                <div className="space-y-1.5 sm:space-y-2 h-full">
                  {dealMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${
                        msg.is_system
                          ? 'flex justify-center'
                          : msg.user_id === user?.id
                          ? 'flex justify-end'
                          : 'flex justify-start'
                      }`}
                    >
                      {msg.is_system ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                          <Icon name="Info" size={9} className="text-blue-400" />
                          <p className="text-[9px] sm:text-xs text-blue-400 font-semibold">{msg.message}</p>
                        </div>
                      ) : (
                        <div className={`max-w-[90%] sm:max-w-[80%] ${
                          msg.user_id === user?.id
                            ? 'bg-gradient-to-br from-green-800/40 to-green-900/30 border border-green-700/40 shadow-md shadow-green-900/20'
                            : 'bg-gradient-to-br from-card to-muted/50 border border-border shadow-sm'
                        } p-1.5 sm:p-2 rounded-2xl space-y-0.5`}>
                          <div className="flex items-center gap-1">
                            <Avatar className="w-4 h-4 sm:w-5 sm:h-5 ring-1 ring-border/50">
                              <AvatarImage src={msg.avatar_url} />
                              <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(msg.username || '')} text-white text-[8px]`}>
                                {msg.username?.[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[9px] sm:text-xs font-bold truncate">{msg.username}</span>
                            <span className="text-[8px] sm:text-[9px] text-muted-foreground/60 ml-auto flex-shrink-0">
                              {new Date(msg.created_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs leading-snug break-words pl-5 sm:pl-6">{msg.message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {selectedDeal.status !== 'completed' && selectedDeal.status !== 'cancelled' && user && (Number(user.id) === Number(selectedDeal.seller_id) || Number(user.id) === Number(selectedDeal.buyer_id)) && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Сообщение..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 bg-muted/50 h-8 sm:h-9 text-xs sm:text-sm border-border/50 transition-all duration-200 focus:shadow-md"
                    inputMode="text"
                    autoComplete="off"
                  />
                  <Button 
                    onClick={sendMessage} 
                    size="icon" 
                    className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 h-8 w-8 sm:h-9 sm:w-9 shadow-md shadow-green-900/30 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-green-800/50 touch-manipulation"
                    type="button"
                  >
                    <Icon name="Send" size={13} />
                  </Button>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="space-y-1.5 flex-shrink-0">
                {selectedDeal.status === 'active' && !selectedDeal.buyer_id && user && Number(user.id) !== Number(selectedDeal.seller_id) && (
                  <Button
                    onClick={handleBuyerPay}
                    disabled={actionLoading}
                    className="w-full bg-gradient-to-r from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 h-9 sm:h-11 text-xs sm:text-base font-bold shadow-lg shadow-green-900/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-green-800/60 touch-manipulation disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Icon name={actionLoading ? "Loader2" : "ShoppingCart"} size={14} className={`mr-1 ${actionLoading ? 'animate-spin' : ''}`} />
                    {actionLoading ? 'Оплата...' : `Купить ${selectedDeal.price} USDT`}
                  </Button>
                )}

                {selectedDeal.step === 'seller_sending' && user && Number(user.id) === Number(selectedDeal.seller_id) && (
                  <Button
                    onClick={handleSellerSent}
                    disabled={actionLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 h-9 sm:h-11 text-xs sm:text-base font-bold shadow-lg shadow-purple-900/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-purple-800/60 touch-manipulation disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Icon name="Package" size={14} className="mr-1" />
                    {actionLoading ? 'Обработка...' : 'Товар передан'}
                  </Button>
                )}

                {selectedDeal.step === 'buyer_confirming' && user && Number(user.id) === Number(selectedDeal.buyer_id) && (
                  <Card className="p-2 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 space-y-1.5 shadow-lg shadow-orange-900/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-800/30 animate-pulse-subtle">
                    <div className="flex items-start gap-1.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                        <Icon name="AlertCircle" size={14} className="text-orange-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs font-bold text-orange-300">⚠️ Внимание!</p>
                        <p className="text-[9px] sm:text-xs text-muted-foreground/80 leading-tight">
                          Только если получили товар! {selectedDeal.price} USDT → продавцу
                        </p>
                      </div>
                    </div>
                    <Button
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!actionLoading) handleBuyerConfirm();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!actionLoading) handleBuyerConfirm();
                      }}
                      disabled={actionLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 cursor-pointer h-9 sm:h-10 text-xs sm:text-base font-bold shadow-lg shadow-green-900/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-green-800/60 touch-manipulation disabled:opacity-50 disabled:hover:scale-100"
                      type="button"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Icon name="Check" size={14} className="mr-1" />
                      {actionLoading ? 'Обработка...' : 'Подтвердить получение'}
                    </Button>
                  </Card>
                )}

                {selectedDeal.status === 'completed' && (
                  <Card className="p-2 bg-gradient-to-br from-green-800/15 to-green-900/25 border-green-500/30 shadow-lg shadow-green-900/30">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                        <Icon name="CheckCircle2" size={16} className="text-green-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-green-300 text-xs sm:text-base leading-tight">Сделка завершена!</h4>
                        <p className="text-[9px] sm:text-xs text-muted-foreground/80 leading-tight">
                          {user && Number(user.id) === Number(selectedDeal.seller_id) ? `Вы получили ${(selectedDeal.price - selectedDeal.commission).toFixed(2)} USDT (комиссия ${selectedDeal.commission.toFixed(2)} USDT)` : `Сделка успешно завершена`}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
          )}
        </>
      )}

      {/* Диалог подтверждения получения товара */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Подтверждение получения</DialogTitle>
            <DialogDescription>
              Вы уверены, что получили товар?
            </DialogDescription>
          </DialogHeader>

          <Card className="bg-orange-500/5 border-orange-500/20 p-4">
            <p className="text-sm text-muted-foreground">
              После подтверждения средства <strong className="text-orange-400">{selectedDeal?.price} USDT</strong> будут переведены продавцу. 
              <br /><br />
              <strong>Это действие нельзя отменить!</strong>
            </p>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation"
              disabled={actionLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={confirmBuyerConfirm}
              disabled={actionLoading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-green-700/50 touch-manipulation disabled:opacity-50 disabled:hover:scale-100"
            >
              <Icon name={actionLoading ? "Loader2" : "Check"} size={16} className={`mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
              {actionLoading ? 'Обработка...' : 'Да, подтверждаю'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};