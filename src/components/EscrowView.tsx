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

const ESCROW_URL = 'https://functions.poehali.dev/82c75fbc-83e4-4448-9ff8-1c8ef9bbec09';

interface EscrowViewProps {
  user: User | null;
  onShowAuthDialog: () => void;
}

export const EscrowView = ({ user, onShowAuthDialog }: EscrowViewProps) => {
  const [deals, setDeals] = useState<EscrowDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<EscrowDeal | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'dispute'>('all');
  
  const [newDeal, setNewDeal] = useState({
    title: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    fetchDeals();
  }, [statusFilter]);

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
      alert('Заполните все поля');
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
        alert('Сделка создана!');
      }
    } catch (error) {
      console.error('Ошибка создания сделки:', error);
      alert('Ошибка создания сделки');
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Гарант-сервис</h1>
          <p className="text-muted-foreground">
            Безопасные сделки с гарантией платформы
          </p>
        </div>
        <Button
          onClick={() => user ? setShowCreateDialog(true) : onShowAuthDialog()}
          className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
        >
          <Icon name="Plus" size={18} className="mr-2" />
          Создать сделку
        </Button>
      </div>

      <Card className="p-6 bg-gradient-to-br from-green-800/10 to-green-900/5 border-green-800/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon name="ShieldCheck" size={24} className="text-green-400" />
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="text-lg font-semibold">Как работает гарант-сервис?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-800/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-400">1</span>
                </div>
                <div>
                  <p className="font-medium text-green-400">Продавец создает сделку</p>
                  <p className="text-muted-foreground text-xs">Описывает товар и указывает цену</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-800/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-400">2</span>
                </div>
                <div>
                  <p className="font-medium text-green-400">Покупатель вносит оплату</p>
                  <p className="text-muted-foreground text-xs">Средства блокируются на платформе</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-800/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-400">3</span>
                </div>
                <div>
                  <p className="font-medium text-green-400">Товар передан</p>
                  <p className="text-muted-foreground text-xs">Продавец получает оплату</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Все', icon: 'List' },
          { id: 'open', label: 'Открытые', icon: 'Clock' },
          { id: 'in_progress', label: 'В процессе', icon: 'Loader2' },
          { id: 'completed', label: 'Завершенные', icon: 'Check' },
          { id: 'dispute', label: 'Споры', icon: 'AlertTriangle' }
        ].map((filter) => (
          <Button
            key={filter.id}
            variant={statusFilter === filter.id ? 'default' : 'outline'}
            size="sm"
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
        <Card className="p-12 text-center">
          <Icon name="Package" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Сделок не найдено</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((deal) => (
            <Card
              key={deal.id}
              className={`p-4 transition-all cursor-pointer ${getStatusColor(deal.status)}`}
              onClick={() => setSelectedDeal(deal)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {deal.description}
                    </p>
                  </div>
                  {getStatusBadge(deal.status)}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
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
                    <p className="text-lg font-bold text-green-400">{deal.price} USDT</p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать сделку</DialogTitle>
            <DialogDescription>
              Создайте сделку для безопасной передачи товара
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название товара/услуги</Label>
              <Input
                value={newDeal.title}
                onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                placeholder="Например: Telegram Premium 12 месяцев"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={newDeal.description}
                onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                placeholder="Подробно опишите товар или услугу"
                className="min-h-[100px]"
              />
            </div>
            <div>
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
            <Button
              onClick={createDeal}
              className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Создать сделку
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedDeal && (
        <DealDetailDialog
          deal={selectedDeal}
          user={user}
          onClose={() => setSelectedDeal(null)}
          onUpdate={fetchDeals}
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
}

const DealDetailDialog = ({ deal, user, onClose, onUpdate }: DealDetailDialogProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDealDetails();
    const interval = setInterval(fetchDealDetails, 5000);
    return () => clearInterval(interval);
  }, [deal.id]);

  const fetchDealDetails = async () => {
    try {
      const response = await fetch(`${ESCROW_URL}?action=deal&id=${deal.id}`);
      const data = await response.json();
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
          deal_id: deal.id,
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
          deal_id: deal.id
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Вы присоединились к сделке!');
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const buyerPaid = async () => {
    if (!user) return;
    setLoading(true);

    try {
      await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'buyer_paid',
          deal_id: deal.id
        })
      });
      fetchDealDetails();
      onUpdate();
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
      await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'seller_confirm',
          deal_id: deal.id
        })
      });
      fetchDealDetails();
      onUpdate();
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const buyerConfirm = async () => {
    if (!user || !confirm('Подтвердить получение товара? Средства будут переведены продавцу.')) return;
    setLoading(true);

    try {
      await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'buyer_confirm',
          deal_id: deal.id
        })
      });
      alert('Сделка завершена!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSeller = user?.id === deal.seller_id;
  const isBuyer = user?.id === deal.buyer_id;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>{deal.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {deal.description}
              </DialogDescription>
            </div>
            {deal.status === 'open' && (
              <Badge variant="default" className="bg-green-800">Открыта</Badge>
            )}
            {deal.status === 'in_progress' && (
              <Badge variant="secondary">В процессе</Badge>
            )}
            {deal.status === 'completed' && (
              <Badge variant="outline">Завершена</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Продавец</p>
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={deal.seller_avatar} />
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(deal.seller_name || '')} text-white text-xs`}>
                    {deal.seller_name?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{deal.seller_name}</p>
              </div>
            </Card>

            <Card className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Цена</p>
              <p className="text-2xl font-bold text-green-400">{deal.price} USDT</p>
            </Card>
          </div>

          {deal.buyer_id && (
            <Card className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Покупатель</p>
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={deal.buyer_avatar} />
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(deal.buyer_name || '')} text-white text-xs`}>
                    {deal.buyer_name?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{deal.buyer_name}</p>
              </div>
            </Card>
          )}

          <Card className="p-4 max-h-[300px] overflow-y-auto bg-muted/30">
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.is_system
                      ? 'bg-blue-500/10 border border-blue-500/20 text-center text-sm'
                      : msg.user_id === user?.id
                      ? 'bg-green-800/20 border border-green-800/30 ml-8'
                      : 'bg-card mr-8'
                  }`}
                >
                  {!msg.is_system && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={msg.avatar_url} />
                        <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(msg.username || '')} text-white text-xs`}>
                          {msg.username?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{msg.username}</span>
                    </div>
                  )}
                  <p className={msg.is_system ? 'text-blue-400 font-medium' : ''}>{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {deal.status !== 'completed' && deal.status !== 'cancelled' && (isSeller || isBuyer) && (
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Написать сообщение..."
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button onClick={sendMessage} size="icon">
                <Icon name="Send" size={18} />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {deal.status === 'open' && !isSeller && (
              <Button
                onClick={joinDeal}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
              >
                <Icon name="ShoppingCart" size={18} className="mr-2" />
                Купить за {deal.price} USDT
              </Button>
            )}

            {deal.status === 'in_progress' && isBuyer && !deal.buyer_paid && (
              <Button
                onClick={buyerPaid}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
              >
                <Icon name="CreditCard" size={18} className="mr-2" />
                Я оплатил товар
              </Button>
            )}

            {deal.status === 'in_progress' && isSeller && deal.buyer_paid && !deal.seller_confirmed && (
              <Button
                onClick={sellerConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
              >
                <Icon name="Package" size={18} className="mr-2" />
                Товар передан покупателю
              </Button>
            )}

            {deal.status === 'in_progress' && isBuyer && deal.seller_confirmed && (
              <Button
                onClick={buyerConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600"
              >
                <Icon name="Check" size={18} className="mr-2" />
                Подтвердить получение товара
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
