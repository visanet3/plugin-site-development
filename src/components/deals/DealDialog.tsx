import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { getAvatarGradient } from '@/utils/avatarColors';
import { Deal, User } from '@/types';

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
  user: User | null;
  messages: any[];
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onBuyerPay: () => void;
  onSellerSent: () => void;
  onBuyerConfirm: () => void;
  onDispute: () => void;
  onCancelDeal: () => void;
  actionLoading: boolean;
}

export const DealDialog = ({
  open,
  onOpenChange,
  deal,
  user,
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
  onBuyerPay,
  onSellerSent,
  onBuyerConfirm,
  onDispute,
  onCancelDeal,
  actionLoading
}: DealDialogProps) => {
  if (!deal) return null;

  const isSeller = user && deal.seller_id === user.id;
  const isBuyer = user && deal.buyer_id === user.id;
  const isParticipant = isSeller || isBuyer;

  const getStatusBadge = () => {
    if (deal.status === 'active') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Активна</Badge>;
    }
    if (deal.status === 'paid') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Оплачена</Badge>;
    }
    if (deal.status === 'sent') {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Отправлена</Badge>;
    }
    if (deal.status === 'completed') {
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Завершена</Badge>;
    }
    if (deal.status === 'cancelled') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Отменена</Badge>;
    }
    if (deal.status === 'dispute') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Спор</Badge>;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span className="flex-1">{deal.title}</span>
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2 -mr-2">
          <div className="flex items-start justify-between gap-4 p-4 bg-card/50 rounded-lg border border-primary/10">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Avatar className="w-12 h-12">
                {deal.seller_avatar_url ? (
                  <AvatarImage src={deal.seller_avatar_url} alt={deal.seller_username} />
                ) : (
                  <AvatarFallback className={getAvatarGradient(deal.seller_id)}>
                    {deal.seller_username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold truncate">{deal.seller_username}</p>
                  <Badge variant="outline" className="text-xs">Продавец</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(deal.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-primary flex items-center gap-1 justify-end">
                <Icon name="DollarSign" size={20} />
                {deal.price.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">USDT</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Описание</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p>
          </div>

          {deal.buyer_id && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="w-10 h-10">
                  {deal.buyer_avatar_url ? (
                    <AvatarImage src={deal.buyer_avatar_url} alt={deal.buyer_username} />
                  ) : (
                    <AvatarFallback className={getAvatarGradient(deal.buyer_id)}>
                      {deal.buyer_username!.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{deal.buyer_username}</p>
                    <Badge variant="outline" className="text-xs">Покупатель</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isParticipant && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Icon name="MessageSquare" size={18} />
                Чат сделки
              </h3>
              <div className="border border-primary/20 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Сообщений пока нет
                  </p>
                ) : (
                  messages.map((msg, idx) => {
                    const isMyMessage = user && msg.sender_id === user.id;
                    const isSystem = msg.is_system;
                    
                    if (isSystem) {
                      return (
                        <div key={idx} className="text-center py-2">
                          <p className="text-xs text-muted-foreground bg-muted/30 inline-block px-3 py-1 rounded-full">
                            {msg.message}
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={idx} className={`flex gap-2 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          {msg.sender_avatar_url ? (
                            <AvatarImage src={msg.sender_avatar_url} alt={msg.sender_username} />
                          ) : (
                            <AvatarFallback className={getAvatarGradient(msg.sender_id)}>
                              {msg.sender_username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className={`flex-1 ${isMyMessage ? 'text-right' : ''}`}>
                          <div className={`inline-block px-3 py-2 rounded-lg text-sm ${
                            isMyMessage 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="font-semibold text-xs mb-1">{msg.sender_username}</p>
                            <p>{msg.message}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(msg.created_at).toLocaleTimeString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => onMessageChange(e.target.value)}
                  placeholder="Введите сообщение..."
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
                  autoFocus={false}
                />
                <Button onClick={onSendMessage} size="icon">
                  <Icon name="Send" size={18} />
                </Button>
              </div>
            </div>
          )}

          {user && deal.status === 'active' && !deal.buyer_id && !isSeller && (
            <Button onClick={onBuyerPay} disabled={actionLoading} className="w-full" size="lg">
              <Icon name="ShoppingCart" size={18} className="mr-2" />
              Купить за {deal.price.toFixed(2)} USDT
            </Button>
          )}

          {isSeller && deal.status === 'active' && (
            <Button onClick={onCancelDeal} disabled={actionLoading} variant="destructive" className="w-full">
              <Icon name="X" size={18} className="mr-2" />
              Отменить объявление
            </Button>
          )}

          {isSeller && deal.status === 'paid' && (
            <Button onClick={onSellerSent} disabled={actionLoading} className="w-full" size="lg">
              <Icon name="Send" size={18} className="mr-2" />
              Я передал товар покупателю
            </Button>
          )}

          {isBuyer && deal.status === 'sent' && (
            <div className="space-y-2">
              <Button onClick={onBuyerConfirm} disabled={actionLoading} className="w-full" size="lg">
                <Icon name="Check" size={18} className="mr-2" />
                Подтвердить получение товара
              </Button>
              <Button onClick={onDispute} disabled={actionLoading} variant="destructive" className="w-full">
                <Icon name="AlertTriangle" size={18} className="mr-2" />
                Открыть спор
              </Button>
            </div>
          )}

          {deal.status === 'dispute' && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-500 mb-1">Сделка в споре</p>
                  <p className="text-sm text-muted-foreground">
                    Администрация рассматривает спор. Решение будет принято в течение 24 часов.
                    Пожалуйста, предоставьте все доказательства в чате сделки.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};