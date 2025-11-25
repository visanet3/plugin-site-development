import { Deal, User } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { getAvatarGradient } from '@/utils/avatarColors';
import { useEffect, useRef } from 'react';

interface DealDialogMobileProps {
  deal: Deal;
  user: User | null;
  dealMessages: any[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  sendMessage: () => void;
  actionLoading: boolean;
  onClose: () => void;
  getStepText: (step: string, isSeller: boolean) => string;
  handleBuyerPay: () => void;
  handleSellerSent: () => void;
  handleBuyerConfirm: () => void;
}

export const DealDialogMobile = ({
  deal,
  user,
  dealMessages,
  newMessage,
  setNewMessage,
  sendMessage,
  actionLoading,
  onClose,
  getStepText,
  handleBuyerPay,
  handleSellerSent,
  handleBuyerConfirm
}: DealDialogMobileProps) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
    };
  }, []);
  
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0 }}>
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <div className="flex-1 pr-10 min-w-0">
          <h2 className="text-sm font-semibold leading-tight truncate">{deal.title}</h2>
          <p className="text-xs text-muted-foreground truncate">{deal.description}</p>
        </div>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted active:scale-95 transition-all z-50"
          type="button"
        >
          <Icon name="X" size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col space-y-2 p-3 min-h-0 overflow-y-auto">
        {user && (Number(user.id) === Number(deal.seller_id) || Number(user.id) === Number(deal.buyer_id)) && (
          <Card className="p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                <Icon name={Number(user.id) === Number(deal.seller_id) ? "Store" : "ShoppingCart"} size={14} className="text-blue-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-blue-300">
                  {Number(user.id) === Number(deal.seller_id) ? 'Вы - продавец' : 'Вы - покупатель'}
                </p>
                <p className="text-[10px] text-muted-foreground/80 truncate">
                  {getStepText(deal.step, Number(user.id) === Number(deal.seller_id))}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Card className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/15 border-green-500/30">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/40 flex items-center justify-center">
                <Icon name="Store" size={14} className="text-green-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-muted-foreground/70 mb-0.5">Продавец</p>
                <p className="font-bold text-[10px] truncate text-green-300">{deal.seller_name}</p>
              </div>
            </div>
          </Card>

          <Card className="p-2 bg-gradient-to-br from-amber-500/10 to-yellow-600/15 border-amber-500/30">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-600/40 flex items-center justify-center">
                <Icon name="DollarSign" size={16} className="text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-muted-foreground/70 mb-0.5">Сумма</p>
                <p className="text-sm font-black text-amber-300 truncate">{deal.price} <span className="text-[9px]">USDT</span></p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-2 flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="space-y-1.5">
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
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <Icon name="Info" size={9} className="text-blue-400" />
                    <p className="text-[9px] text-blue-400 font-semibold">{msg.message}</p>
                  </div>
                ) : (
                  <div className={`max-w-[90%] ${
                    msg.user_id === user?.id
                      ? 'bg-gradient-to-br from-green-800/40 to-green-900/30 border border-green-700/40'
                      : 'bg-gradient-to-br from-card to-muted/50 border border-border'
                  } p-1.5 rounded-2xl space-y-0.5`}>
                    <div className="flex items-center gap-1">
                      <Avatar className="w-4 h-4 ring-1 ring-border/50">
                        <AvatarImage src={msg.avatar_url} />
                        <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(msg.username || '')} text-white text-[8px]`}>
                          {msg.username?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[9px] font-bold truncate">{msg.username}</span>
                      <span className="text-[8px] text-muted-foreground/60 ml-auto">
                        {new Date(msg.created_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] leading-snug break-words pl-5">{msg.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {deal.status !== 'completed' && deal.status !== 'cancelled' && user && (Number(user.id) === Number(deal.seller_id) || Number(user.id) === Number(deal.buyer_id)) && (
        <div className="flex items-center gap-1.5 p-3 border-t border-border flex-shrink-0 bg-background">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Сообщение..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 h-9 px-3 text-sm rounded-md border border-input bg-muted/50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <Button 
            onClick={sendMessage} 
            size="icon" 
            className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 h-9 w-9"
            type="button"
          >
            <Icon name="Send" size={16} />
          </Button>
        </div>
      )}

      {deal.status === 'active' && !deal.buyer_id && user && Number(user.id) !== Number(deal.seller_id) && (
        <div className="p-3 border-t border-border flex-shrink-0">
          <Button
            onClick={handleBuyerPay}
            disabled={actionLoading}
            className="w-full bg-gradient-to-r from-green-700 to-green-900 h-11"
          >
            <Icon name={actionLoading ? "Loader2" : "ShoppingCart"} size={16} className={`mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
            {actionLoading ? 'Оплата...' : `Купить ${deal.price} USDT`}
          </Button>
        </div>
      )}

      {deal.step === 'buyer_paid' && user && Number(user.id) === Number(deal.seller_id) && (
        <div className="p-3 border-t border-border flex-shrink-0">
          <Button
            onClick={handleSellerSent}
            disabled={actionLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 h-11"
          >
            <Icon name="Package" size={16} className="mr-2" />
            {actionLoading ? 'Обработка...' : 'Товар передан'}
          </Button>
        </div>
      )}

      {deal.step === 'seller_sent' && user && Number(user.id) === Number(deal.buyer_id) && (
        <div className="p-3 border-t border-border flex-shrink-0">
          <Card className="p-2 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 mb-2">
            <p className="text-xs text-orange-300 mb-1">⚠️ Внимание!</p>
            <p className="text-[10px] text-muted-foreground">
              Только если получили товар! {deal.price} USDT → продавцу
            </p>
          </Card>
          <Button
            onClick={handleBuyerConfirm}
            disabled={actionLoading}
            className="w-full bg-gradient-to-r from-green-600 to-green-800 h-11"
          >
            <Icon name="Check" size={16} className="mr-2" />
            {actionLoading ? 'Обработка...' : 'Подтвердить получение'}
          </Button>
        </div>
      )}
    </div>
  );
};