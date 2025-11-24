import { useState, useEffect } from 'react';
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

const DEALS_URL = 'https://functions.poehali.dev/8a665174-b0af-4138-82e0-a9422dbb8fc4';

interface DealsViewProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

export const DealsView = ({ user, onShowAuthDialog, onRefreshUserBalance }: DealsViewProps) => {
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
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

  useEffect(() => {
    fetchDeals();
  }, [statusFilter, user]);

  useEffect(() => {
    if (selectedDeal) {
      const interval = setInterval(() => {
        fetchDealDetails(selectedDeal.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedDeal]);

  const fetchDeals = async () => {
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
  };

  const fetchDealDetails = async (dealId: number) => {
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
        fetchDeals();
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
        onRefreshUserBalance?.();
        await fetchDealDetails(selectedDeal.id);
        setStatusFilter('my_deals');
        fetchDeals();
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
        
        onRefreshUserBalance?.();
        await fetchDealDetails(selectedDeal.id);
        setStatusFilter('completed');
        fetchDeals();
        
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
      buyer_paid: {
        seller: '💰 Покупатель оплатил. Передайте товар',
        buyer: '⏳ Ожидайте передачи товара от продавца'
      },
      seller_sent: {
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Гарант-сервис</h1>
          <p className="text-sm text-muted-foreground">
            Безопасные сделки с защитой средств. Комиссия 1% с продавца
          </p>
        </div>
        <Button
          onClick={() => user ? setShowCreateDialog(true) : onShowAuthDialog()}
          className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 w-full sm:w-auto"
        >
          <Icon name="Plus" size={16} className="mr-2" />
          Разместить объявление
        </Button>
      </div>

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-800/10 to-green-900/5 border-green-800/20">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-green-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon name="ShieldCheck" size={24} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Как работает?</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Продавец размещает объявление</li>
              <li>Покупатель оплачивает (средства блокируются)</li>
              <li>Продавец передает товар</li>
              <li>Покупатель подтверждает получение</li>
              <li>Средства переводятся продавцу (минус 1% комиссия)</li>
            </ol>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'active', label: 'Активные', icon: 'Store' },
          { id: 'my_deals', label: 'Мои сделки', icon: 'ShoppingCart' },
          { id: 'completed', label: 'Завершенные', icon: 'Check' }
        ].map((filter) => (
          <Button
            key={filter.id}
            variant={statusFilter === filter.id ? 'default' : 'outline'}
            size="sm"
            className={`whitespace-nowrap ${statusFilter === filter.id ? 'bg-green-800 hover:bg-green-700' : ''}`}
            onClick={() => setStatusFilter(filter.id as any)}
          >
            <Icon name={filter.icon as any} size={16} className="mr-2" />
            {filter.label}
          </Button>
        ))}
      </div>

      {statusFilter !== 'active' && !user && (
        <Card className="p-3 bg-orange-500/5 border-orange-500/20">
          <p className="text-sm text-orange-400 flex items-center gap-2">
            <Icon name="Lock" size={16} />
            <span>Войдите, чтобы увидеть свои сделки</span>
          </p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : deals.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Icon name="Package" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">
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
              className="p-4 transition-all cursor-pointer hover:border-green-700/70"
              onClick={() => {
                setSelectedDeal(deal);
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
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-400">{deal.price} USDT</p>
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
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={newDeal.description}
                onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                placeholder="Подробное описание товара..."
                className="min-h-[100px] resize-none"
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
              />
            </div>

            <Card className="bg-blue-500/5 border-blue-500/20 p-3">
              <p className="text-xs text-blue-400">
                ℹ️ После успешного завершения сделки с вас будет удержана комиссия 1%
              </p>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
                type="button"
              >
                Отмена
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  createDeal();
                }}
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-800"
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
      {selectedDeal && (
        <Dialog open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="pr-8 text-xl">{selectedDeal.title}</DialogTitle>
              <DialogDescription className="text-base">{selectedDeal.description}</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {user && (Number(user.id) === Number(selectedDeal.seller_id) || Number(user.id) === Number(selectedDeal.buyer_id)) && (
                <Card className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon name={Number(user.id) === Number(selectedDeal.seller_id) ? "Store" : "ShoppingCart"} size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {Number(user.id) === Number(selectedDeal.seller_id) ? 'Вы - продавец' : 'Вы - покупатель'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getStepText(selectedDeal.step, Number(user.id) === Number(selectedDeal.seller_id))}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-4 bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-500/20">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Продавец</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedDeal.seller_avatar} />
                      <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(selectedDeal.seller_name)} text-white text-sm`}>
                        {selectedDeal.seller_name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm">{selectedDeal.seller_name}</p>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-600/10 to-green-700/20 border-green-600/30">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Цена</p>
                  <p className="text-2xl font-bold text-green-400">{selectedDeal.price} <span className="text-lg text-muted-foreground">USDT</span></p>
                </Card>

                {selectedDeal.buyer_id && (
                  <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Покупатель</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedDeal.buyer_avatar} />
                        <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(selectedDeal.buyer_name || '')} text-white text-sm`}>
                          {selectedDeal.buyer_name?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm">{selectedDeal.buyer_name}</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Чат */}
              <Card className="p-4 h-[400px] md:h-[500px] overflow-y-auto bg-gradient-to-br from-muted/30 to-muted/10 border-border/50">
                <div className="space-y-3">
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
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                          <Icon name="Info" size={12} className="text-blue-400" />
                          <p className="text-xs text-blue-400 font-medium">{msg.message}</p>
                        </div>
                      ) : (
                        <div className={`max-w-[75%] ${
                          msg.user_id === user?.id
                            ? 'bg-green-800/30 border border-green-700/40'
                            : 'bg-card border border-border'
                        } p-3 rounded-2xl space-y-1`}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={msg.avatar_url} />
                              <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(msg.username || '')} text-white text-[10px]`}>
                                {msg.username?.[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold">{msg.username}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(msg.created_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {selectedDeal.status !== 'completed' && selectedDeal.status !== 'cancelled' && user && (Number(user.id) === Number(selectedDeal.seller_id) || Number(user.id) === Number(selectedDeal.buyer_id)) && (
                <div className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишите сообщение..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 bg-muted/50"
                  />
                  <Button onClick={sendMessage} size="icon" className="bg-green-700 hover:bg-green-600">
                    <Icon name="Send" size={16} />
                  </Button>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="space-y-2">
                {selectedDeal.status === 'active' && !selectedDeal.buyer_id && user && Number(user.id) !== Number(selectedDeal.seller_id) && (
                  <Button
                    onClick={handleBuyerPay}
                    disabled={actionLoading}
                    className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 h-12 text-base"
                  >
                    <Icon name={actionLoading ? "Loader2" : "ShoppingCart"} size={18} className={`mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
                    {actionLoading ? 'Оплачиваем...' : `Купить за ${selectedDeal.price} USDT`}
                  </Button>
                )}

                {selectedDeal.step === 'buyer_paid' && user && Number(user.id) === Number(selectedDeal.seller_id) && (
                  <Button
                    onClick={handleSellerSent}
                    disabled={actionLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 h-12 text-base"
                  >
                    <Icon name="Package" size={18} className="mr-2" />
                    {actionLoading ? 'Обработка...' : 'Товар передан покупателю'}
                  </Button>
                )}

                {selectedDeal.step === 'seller_sent' && user && Number(user.id) === Number(selectedDeal.buyer_id) && (
                  <Card className="p-4 bg-gradient-to-br from-green-800/10 to-green-900/20 border border-green-500/30 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="AlertCircle" size={20} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-400 mb-1">⚠️ Внимание!</p>
                        <p className="text-sm text-muted-foreground">
                          Нажимайте только если получили товар. {selectedDeal.price} USDT будут переведены продавцу
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBuyerConfirm();
                      }}
                      disabled={actionLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 cursor-pointer h-12 text-base"
                      type="button"
                    >
                      <Icon name="Check" size={18} className="mr-2" />
                      {actionLoading ? 'Обработка...' : 'Подтвердить получение товара'}
                    </Button>
                  </Card>
                )}

                {selectedDeal.status === 'completed' && (
                  <Card className="p-4 bg-gradient-to-br from-green-800/10 to-green-900/20 border-green-500/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="CheckCircle2" size={24} className="text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-400 text-base">Сделка завершена!</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {user && Number(user.id) === Number(selectedDeal.seller_id) ? `Вы получили ${(selectedDeal.price - selectedDeal.commission).toFixed(2)} USDT (комиссия ${selectedDeal.commission.toFixed(2)} USDT)` : `Средства ${selectedDeal.price} USDT переведены продавцу`}
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
              className="flex-1"
              disabled={actionLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={confirmBuyerConfirm}
              disabled={actionLoading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700"
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