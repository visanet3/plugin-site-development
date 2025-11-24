import React, { useState, useEffect } from 'react';
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
import UserRankBadge from '@/components/UserRankBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ESCROW_URL = 'https://functions.poehali.dev/82c75fbc-83e4-4448-9ff8-1c8ef9bbec09';

interface EscrowViewProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

const CATEGORIES = [
  { id: 'coins', label: 'Монеты', icon: 'Coins', color: 'text-yellow-400', bg: 'bg-yellow-800/20' },
  { id: 'contracts', label: 'Контракты', icon: 'FileText', color: 'text-blue-400', bg: 'bg-blue-800/20' },
  { id: 'programs', label: 'Программы', icon: 'Code', color: 'text-purple-400', bg: 'bg-purple-800/20' },
  { id: 'other', label: 'Другое', icon: 'Package', color: 'text-gray-400', bg: 'bg-gray-800/20' }
];

export const EscrowView = ({ user, onShowAuthDialog, onRefreshUserBalance }: EscrowViewProps) => {
  const { toast } = useToast();
  const [deals, setDeals] = useState<EscrowDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<EscrowDeal | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<'open' | 'in_progress' | 'completed' | 'dispute'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('escrow_filter');
      if (saved && ['open', 'in_progress', 'completed', 'dispute'].includes(saved)) {
        return saved as 'open' | 'in_progress' | 'completed' | 'dispute';
      }
    }
    return 'open';
  });
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [newDeal, setNewDeal] = useState({
    title: '',
    description: '',
    price: '',
    category: 'other' as 'coins' | 'contracts' | 'programs' | 'other'
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('escrow_filter', statusFilter);
    }
  }, [statusFilter]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dealId = urlParams.get('deal');
    
    if (dealId && !selectedDeal && user) {
      loadDealById(dealId);
    }
  }, [user]);

  useEffect(() => {
    fetchDeals();
    if (user) {
      checkDisputeNotifications();
      checkUserActivePurchases();
    }
  }, [statusFilter, categoryFilter, user]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkDisputeNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const checkUserActivePurchases = async () => {
    if (!user) return;
    
    // Проверяем есть ли у пользователя активные покупки
    try {
      const response = await fetch(`${ESCROW_URL}?action=list&status=in_progress`, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });
      const data = await response.json();
      
      if (data.deals && data.deals.length > 0) {
        // Если есть активные покупки и пользователь на вкладке "В продаже"
        // автоматически переключаем на "Мои покупки"
        if (statusFilter === 'open') {
          setStatusFilter('in_progress');
        }
      }
    } catch (error) {
      console.error('Ошибка проверки активных покупок:', error);
    }
  };

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
      const url = new URL(`${ESCROW_URL}`);
      url.searchParams.set('action', 'list');
      url.searchParams.set('status', statusFilter);
      if (categoryFilter !== 'all') {
        url.searchParams.set('category', categoryFilter);
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.deals) {
        setDeals(data.deals);
      }
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDealById = async (dealId: string) => {
    try {
      const headers: HeadersInit = {};
      if (user) {
        headers['X-User-Id'] = user.id.toString();
      }
      
      const response = await fetch(`${ESCROW_URL}?action=deal&id=${dealId}`, { headers });
      const data = await response.json();
      if (data.deal) {
        setSelectedDeal(data.deal);
        
        if (!data.deal.buyer_id) {
          setStatusFilter('open');
        } else if (data.deal.status === 'in_progress') {
          setStatusFilter('in_progress');
        } else if (data.deal.status === 'completed') {
          setStatusFilter('completed');
        } else if (data.deal.status === 'dispute') {
          setStatusFilter('dispute');
        }
      } else {
        const url = new URL(window.location.href);
        url.searchParams.delete('deal');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (error) {
      console.error('Ошибка загрузки сделки:', error);
      const url = new URL(window.location.href);
      url.searchParams.delete('deal');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSelectDeal = (deal: EscrowDeal) => {
    setSelectedDeal(deal);
    const url = new URL(window.location.href);
    url.searchParams.set('deal', deal.id.toString());
    window.history.pushState({}, '', url.toString());
  };

  const handleCloseDeal = () => {
    setSelectedDeal(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('deal');
    window.history.replaceState({}, '', url.toString());
    // НЕ обновляем список при закрытии - обновление только при реальных изменениях статуса
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

    if (creating) {
      return;
    }
    
    setCreating(true);

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
          price: parseFloat(newDeal.price),
          category: newDeal.category
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateDialog(false);
        setNewDeal({ title: '', description: '', price: '', category: 'other' });
        toast({
          title: 'Успешно',
          description: 'Товар выставлен на продажу!'
        });
        
        setStatusFilter('open');
        fetchDeals();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка создания товара',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка создания товара:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка создания товара',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      open: { text: 'В продаже', variant: 'default' },
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

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[3];
    return (
      <div className={`w-8 h-8 ${cat.bg} rounded-lg flex items-center justify-center`}>
        <Icon name={cat.icon as any} size={16} className={cat.color} />
      </div>
    );
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat ? cat.label : 'Другое';
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Маркетплейс</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Покупайте и продавайте с защитой гаранта
          </p>
        </div>
        <Button
          onClick={() => user ? setShowCreateDialog(true) : onShowAuthDialog()}
          className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
        >
          <Icon name="Plus" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
          Разместить товар
        </Button>
      </div>

      <Card className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-green-800/10 to-green-900/5 border-green-800/20">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-800/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="ShieldCheck" size={20} className="text-green-400 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Как работает маркетплейс?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Мы блокируем средства покупателя до получения товара. Продавец получает деньги только после подтверждения покупателем. Это защищает обе стороны от обмана.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                <div className={`w-8 h-8 ${cat.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon name={cat.icon as any} size={16} className={cat.color} />
                </div>
                <span className="text-xs sm:text-sm font-medium">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {[
            { id: 'open', label: 'В продаже', icon: 'Store', desc: 'Доступные товары' },
            { id: 'in_progress', label: 'Мои покупки', icon: 'ShoppingCart', desc: 'Активные сделки' },
            { id: 'completed', label: 'Завершенные', icon: 'Check', desc: 'Успешные сделки' },
            { id: 'dispute', label: 'Споры', icon: 'AlertTriangle', desc: 'Требуют решения админа' }
          ].map((filter) => (
            <Button
              key={filter.id}
              variant={statusFilter === filter.id ? 'default' : 'outline'}
              size="sm"
              className={`text-xs sm:text-sm whitespace-nowrap ${statusFilter === filter.id ? 'bg-green-800 hover:bg-green-700' : ''}`}
              onClick={() => setStatusFilter(filter.id as any)}
              title={filter.desc}
            >
              <Icon name={filter.icon as any} size={16} className="mr-2" />
              {filter.label}
            </Button>
          ))}
        </div>

        {statusFilter === 'open' && (
          <Card className="p-2 sm:p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Категория:</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className={`text-xs h-7 ${categoryFilter === 'all' ? 'bg-green-800 hover:bg-green-700' : ''}`}
                  onClick={() => setCategoryFilter('all')}
                >
                  Все
                </Button>
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={categoryFilter === cat.id ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs h-7 ${categoryFilter === cat.id ? 'bg-green-800 hover:bg-green-700' : ''}`}
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    <Icon name={cat.icon as any} size={14} className="mr-1" />
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        )}
        
        {statusFilter === 'open' && !user && (
          <Card className="p-2 sm:p-3 bg-blue-500/5 border-blue-500/20">
            <p className="text-xs text-blue-400 flex items-center gap-2">
              <Icon name="Info" size={14} />
              <span>Войдите, чтобы покупать товары</span>
            </p>
          </Card>
        )}
        
        {statusFilter !== 'open' && !user && (
          <Card className="p-2 sm:p-3 bg-orange-500/5 border-orange-500/20">
            <p className="text-xs text-orange-400 flex items-center gap-2">
              <Icon name="Lock" size={14} />
              <span>Войдите, чтобы увидеть свои покупки</span>
            </p>
          </Card>
        )}
        
        {statusFilter === 'in_progress' && user && deals.length === 0 && (
          <Card className="p-3 sm:p-4 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-start gap-2 sm:gap-3">
              <Icon name="Info" size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm text-blue-400 font-medium">У вас пока нет активных покупок</p>
                <p className="text-xs text-muted-foreground">
                  Перейдите на вкладку "В продаже" чтобы купить товары
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : deals.length === 0 ? (
        <Card className="p-6 sm:p-8 md:p-12 text-center space-y-3">
          <Icon name="Package" size={36} className="mx-auto mb-4 text-muted-foreground sm:w-12 sm:h-12" />
          <p className="text-muted-foreground font-medium">
            {statusFilter === 'open' && 'Нет товаров в продаже'}
            {statusFilter === 'in_progress' && 'У вас нет активных покупок'}
            {statusFilter === 'completed' && 'У вас нет завершенных сделок'}
            {statusFilter === 'dispute' && 'У вас нет споров'}
          </p>
          {statusFilter === 'open' && user && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Разместить первый товар
            </Button>
          )}
          {statusFilter === 'in_progress' && user && (
            <Button
              onClick={() => setStatusFilter('open')}
              className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
            >
              <Icon name="Store" size={16} className="mr-2" />
              Перейти к товарам
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {deals.map((deal) => (
            <Card
              key={deal.id}
              className={`p-3 sm:p-4 transition-all cursor-pointer ${getStatusColor(deal.status)}`}
              onClick={() => handleSelectDeal(deal)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  {getCategoryIcon(deal.category)}
                  {getStatusBadge(deal.status)}
                </div>

                <div>
                  <h3 className="font-semibold text-base sm:text-lg truncate">{deal.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{getCategoryLabel(deal.category)}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {deal.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
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
                    <p className="text-lg font-bold text-green-400">{deal.price} USDT</p>
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
          <div className="relative overflow-hidden bg-gradient-to-br from-green-800/20 via-green-900/10 to-background border-b border-green-800/30 p-4 sm:p-5 md:p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center shadow-lg">
                  <Icon name="Store" size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold">Разместить товар</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                    Продавайте с защитой гаранта
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Icon name="Package" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                Название товара
              </Label>
              <Input
                value={newDeal.title}
                onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                placeholder="Например: Bitcoin 0.01 BTC"
                className="text-sm sm:text-base h-10 sm:h-11"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Icon name="Tag" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                Категория
              </Label>
              <Select 
                value={newDeal.category} 
                onValueChange={(value: any) => setNewDeal({ ...newDeal, category: value })}
              >
                <SelectTrigger className="text-sm sm:text-base h-10 sm:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <Icon name={cat.icon as any} size={14} className={cat.color} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Icon name="FileText" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                Описание
              </Label>
              <Textarea
                value={newDeal.description}
                onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                placeholder="Подробное описание товара..."
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
              />
            </div>

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
            </div>

            <Card className="bg-green-800/5 border-green-800/20 p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-800/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="Info" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium">Защита гаранта</p>
                  <ul className="space-y-1 text-[10px] sm:text-xs text-muted-foreground">
                    <li className="flex items-start gap-1.5">
                      <Icon name="Check" size={12} className="mt-0.5 text-green-400 flex-shrink-0" />
                      <span>Деньги блокируются до получения товара</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Icon name="Check" size={12} className="mt-0.5 text-green-400 flex-shrink-0" />
                      <span>Вы получите оплату после подтверждения покупателя</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

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
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 shadow-lg shadow-green-500/20 h-10 sm:h-11 text-xs sm:text-sm font-semibold"
              >
                <Icon name={creating ? "Loader2" : "Store"} size={14} className={`mr-1.5 sm:mr-2 sm:w-4 sm:h-4 ${creating ? 'animate-spin' : ''}`} />
                {creating ? 'Размещаем...' : 'Разместить товар'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedDeal && (
        <DealDetailDialog
          deal={selectedDeal}
          user={user}
          onClose={handleCloseDeal}
          onUpdate={fetchDeals}
          onRefreshUserBalance={onRefreshUserBalance}
          onStatusChange={setStatusFilter}
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
  onStatusChange?: (status: 'open' | 'in_progress' | 'completed' | 'dispute') => void;
}

const DealDetailDialog = ({ deal, user, onClose, onUpdate, onRefreshUserBalance, onStatusChange }: DealDetailDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const [currentDeal, setCurrentDeal] = useState<EscrowDeal>(deal);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const hasShownBuyerJoinedToast = React.useRef(false);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => onClose(), 150);
  };

  useEffect(() => {
    fetchDealDetails();
    const interval = setInterval(fetchDealDetails, 3000);
    return () => clearInterval(interval);
  }, [deal.id]);

  const fetchDealDetails = async () => {
    try {
      const headers: HeadersInit = {};
      if (user) {
        headers['X-User-Id'] = user.id.toString();
      }
      
      const response = await fetch(`${ESCROW_URL}?action=deal&id=${deal.id}`, { headers });
      const data = await response.json();
      if (data.deal) {
        const oldStatus = currentDeal.status;
        const newStatus = data.deal.status;
        const oldBuyerId = currentDeal.buyer_id;
        const newBuyerId = data.deal.buyer_id;
        
        setCurrentDeal(data.deal);
        
        if (oldStatus !== newStatus || (oldBuyerId === null && newBuyerId !== null)) {
          if (newStatus === 'in_progress' && newBuyerId !== null) {
            onStatusChange?.('in_progress');
            
            if (user?.id === data.deal.seller_id && oldBuyerId === null && !hasShownBuyerJoinedToast.current) {
              hasShownBuyerJoinedToast.current = true;
              toast({
                title: '🎉 Товар куплен!',
                description: 'Покупатель оплатил товар. Сделка перемещена в "Мои покупки".',
                duration: 5000
              });
            }
            
            setTimeout(() => {
              onUpdate();
            }, 300);
            
          } else if (newStatus === 'completed') {
            onStatusChange?.('completed');
            setTimeout(() => {
              onUpdate();
            }, 300);
            
          } else if (newStatus === 'dispute') {
            onStatusChange?.('dispute');
            setTimeout(() => {
              onUpdate();
            }, 300);
          }
        }
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
    if (!user) {
      return;
    }
    
    if (loading) {
      return;
    }
    
    if ((user.balance || 0) < currentDeal.price) {
      toast({
        title: 'Недостаточно средств',
        description: `У вас: ${(user.balance || 0).toFixed(2)} USDT, требуется: ${currentDeal.price} USDT. Пополните баланс.`,
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
          title: '🎉 Покупка успешна!',
          description: 'Товар теперь в разделе "Мои покупки". Средства заблокированы до получения.',
          duration: 7000
        });
        
        onRefreshUserBalance?.();
        await fetchDealDetails();
        onStatusChange?.('in_progress');
        await new Promise(resolve => setTimeout(resolve, 500));
        onUpdate();
        
      } else if (data.error === 'Insufficient balance') {
        toast({
          title: 'Недостаточно средств',
          description: `Требуется: ${currentDeal.price} USDT. Пополните баланс.`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка покупки',
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
        toast({
          title: 'Отлично!',
          description: 'Ожидайте подтверждения от продавца.'
        });
        await fetchDealDetails();
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
        toast({
          title: 'Отлично!',
          description: 'Покупатель уведомлен о передаче товара. Ожидайте его подтверждения.'
        });
        await fetchDealDetails();
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
          description: 'Средства переведены продавцу. Спасибо!',
          duration: 5000
        });
        
        onRefreshUserBalance?.();
        await fetchDealDetails();
        onStatusChange?.('completed');
        await new Promise(resolve => setTimeout(resolve, 300));
        onUpdate();
        
        setTimeout(() => {
          handleClose();
        }, 2000);
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
          description: 'Администрация рассмотрит ситуацию и примет решение.',
          duration: 5000
        });
        
        await fetchDealDetails();
        onStatusChange?.('dispute');
        await new Promise(resolve => setTimeout(resolve, 300));
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

  const getStageComment = (status: string, isSeller: boolean) => {
    const comments: Record<string, { seller: string; buyer: string }> = {
      open: {
        seller: '💰 Товар в продаже. Ожидается покупатель.',
        buyer: '🛒 Вы можете купить этот товар. Средства будут заблокированы до получения.'
      },
      in_progress: {
        seller: '📦 Покупатель оплатил товар. Свяжитесь с ним в чате и передайте товар.',
        buyer: '✅ Товар куплен! Средства заблокированы. Свяжитесь с продавцом в чате для получения товара.'
      },
      completed: {
        seller: '✅ Сделка завершена! Средства на вашем балансе.',
        buyer: '✅ Сделка завершена! Продавец получил оплату.'
      },
      dispute: {
        seller: '⚠️ Открыт спор. Администрация примет решение.',
        buyer: '⚠️ Открыт спор. Администрация примет решение.'
      },
      cancelled: {
        seller: '❌ Сделка отменена.',
        buyer: '❌ Сделка отменена. Средства возвращены.'
      }
    };
    const comment = comments[status] || comments.open;
    return isSeller ? comment.seller : comment.buyer;
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[3];
    return (
      <div className={`w-10 h-10 ${cat.bg} rounded-lg flex items-center justify-center`}>
        <Icon name={cat.icon as any} size={20} className={cat.color} />
      </div>
    );
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat ? cat.label : 'Другое';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-background/80 hover:bg-destructive/20 flex items-center justify-center transition-colors z-50 border border-border shadow-lg backdrop-blur-sm"
          aria-label="Закрыть"
        >
          <Icon name="X" size={18} className="text-foreground hover:text-destructive transition-colors" />
        </button>

        <div className="relative overflow-hidden bg-gradient-to-br from-green-800/20 via-green-900/10 to-background border-b border-green-800/30 p-4 sm:p-5 pr-14">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(currentDeal.category)}
                  <Badge variant="outline" className="text-xs">{getCategoryLabel(currentDeal.category)}</Badge>
                </div>
                <DialogTitle className="text-base sm:text-lg md:text-xl truncate pr-2">{currentDeal.title}</DialogTitle>
                <DialogDescription className="mt-1 text-xs sm:text-sm line-clamp-2 pr-2">
                  {currentDeal.description}
                </DialogDescription>
              </div>
            </div>
            <div className="mt-2">
              {currentDeal.status === 'open' && (
                <Badge variant="default" className="bg-green-800 text-[10px] sm:text-xs">В продаже</Badge>
              )}
              {currentDeal.status === 'in_progress' && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">В процессе</Badge>
              )}
              {currentDeal.status === 'completed' && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">Завершена</Badge>
              )}
              {currentDeal.status === 'dispute' && (
                <Badge variant="destructive" className="text-[10px] sm:text-xs">Спор</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
          {user && (isSeller || isBuyer) && (
            <Card className={`p-3 sm:p-4 border-2 ${
              currentDeal.status === 'dispute' ? 'bg-orange-800/10 border-orange-500/30' :
              currentDeal.status === 'in_progress' ? 'bg-blue-800/10 border-blue-500/30' :
              currentDeal.status === 'completed' ? 'bg-green-800/10 border-green-500/30' :
              currentDeal.status === 'cancelled' ? 'bg-red-800/10 border-red-500/30' :
              'bg-yellow-800/10 border-yellow-500/30'
            }`}>
              <div className="flex items-start gap-2 sm:gap-3">
                <Icon 
                  name={
                    currentDeal.status === 'dispute' ? 'AlertTriangle' :
                    currentDeal.status === 'completed' ? 'CheckCircle2' :
                    currentDeal.status === 'cancelled' ? 'XCircle' :
                    'Info'
                  } 
                  size={20} 
                  className={`flex-shrink-0 mt-0.5 ${
                    currentDeal.status === 'dispute' ? 'text-orange-400' :
                    currentDeal.status === 'in_progress' ? 'text-blue-400' :
                    currentDeal.status === 'completed' ? 'text-green-400' :
                    currentDeal.status === 'cancelled' ? 'text-red-400' :
                    'text-yellow-400'
                  }`} 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold mb-1">
                    {isSeller ? 'Вы - продавец' : 'Вы - покупатель'}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {getStageComment(currentDeal.status, isSeller)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {currentDeal.status === 'completed' && (
            <Card className="p-3 sm:p-4 bg-gradient-to-r from-green-800/20 to-green-900/10 border-green-800/30">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-800/30 flex items-center justify-center flex-shrink-0">
                  <Icon name="CheckCircle2" size={20} className="text-green-400 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-green-400 text-sm sm:text-base">Сделка завершена!</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                    {isSeller ? 'Средства зачислены на ваш баланс' : 'Товар получен, средства переведены продавцу'}
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
                autoFocus={false}
                autoComplete="off"
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
                <Icon name={loading ? "Loader2" : "ShoppingCart"} size={16} className={`mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px] ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Покупаем...' : `Купить за ${currentDeal.price} USDT`}
              </Button>
            )}

            {currentDeal.status === 'in_progress' && isBuyer && !currentDeal.buyer_paid && (
              <Button
                onClick={buyerPaid}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Icon name="CreditCard" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Я оплатил
              </Button>
            )}

            {currentDeal.status === 'in_progress' && isSeller && currentDeal.buyer_paid && !currentDeal.seller_confirmed && (
              <Button
                onClick={sellerConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Icon name="Package" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                Товар передан покупателю
              </Button>
            )}

            {currentDeal.status === 'in_progress' && isBuyer && currentDeal.seller_confirmed && (
              <Card className="p-3 sm:p-4 bg-green-800/10 border border-green-500/30 space-y-3">
                <div className="flex items-start gap-2">
                  <Icon name="AlertCircle" size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-green-400">⚠️ Внимание!</strong> Нажимайте только если получили товар. Средства будут переведены продавцу.
                  </p>
                </div>
                <Button
                  onClick={buyerConfirm}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Icon name="Check" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                  {loading ? 'Обработка...' : 'Подтвердить получение товара'}
                </Button>
              </Card>
            )}

            {currentDeal.status === 'in_progress' && (isSeller || isBuyer) && currentDeal.status !== 'dispute' && (
              <Card className="p-3 sm:p-4 bg-orange-800/10 border border-orange-500/30 space-y-3">
                <div className="flex items-start gap-2">
                  <Icon name="AlertTriangle" size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    ⚠️ Открывайте спор при проблемах с передачей товара. Администрация рассмотрит ситуацию.
                  </p>
                </div>
                <Button
                  onClick={openDispute}
                  disabled={loading}
                  variant="destructive"
                  className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Icon name="AlertTriangle" size={16} className="mr-1.5 sm:mr-2 sm:w-[18px] sm:h-[18px]" />
                  {loading ? 'Обработка...' : 'Открыть спор'}
                </Button>
              </Card>
            )}

            {currentDeal.status === 'dispute' && (
              <Card className="p-3 sm:p-4 bg-orange-500/10 border-orange-500/30">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Icon name="AlertTriangle" size={20} className="text-orange-400 flex-shrink-0 sm:w-6 sm:h-6" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-orange-400 text-sm sm:text-base">Спор открыт</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      Администрация рассматривает ситуацию.
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