import { Deal, User } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { getAvatarGradient } from '@/utils/avatarColors';
import { useEffect, useRef, useState } from 'react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [windowHeight, setWindowHeight] = useState('100vh');
  const scrollPositionRef = useRef(0);

  const canInteract = user && (Number(user.id) === Number(deal.seller_id) || Number(user.id) === Number(deal.buyer_id));
  const isCompleted = deal.status === 'completed' || deal.status === 'cancelled';

  useEffect(() => {
    const originalBodyStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      height: document.body.style.height
    };
    
    scrollPositionRef.current = window.scrollY;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.top = `-${scrollPositionRef.current}px`;

    const handleResize = () => {
      const vh = window.innerHeight;
      setWindowHeight(`${vh}px`);
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      document.body.style.overflow = originalBodyStyle.overflow;
      document.body.style.position = originalBodyStyle.position;
      document.body.style.width = originalBodyStyle.width;
      document.body.style.height = originalBodyStyle.height;
      document.body.style.top = '';
      window.scrollTo(0, scrollPositionRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current && contentRef.current) {
      const scrollContainer = contentRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [dealMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage();
      if (inputRef.current) {
        inputRef.current.blur();
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-background"
      style={{
        height: windowHeight,
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div 
        className="bg-background border-b border-border/30"
        style={{
          flexShrink: 0,
          padding: '12px 16px'
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center active:scale-95 transition-transform"
            type="button"
          >
            <Icon name="X" size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate">{deal.title}</h2>
            <p className="text-xs text-muted-foreground truncate">{deal.description}</p>
          </div>
        </div>
      </div>

      <div 
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '16px',
          minHeight: 0
        }}
      >
        <div className="space-y-3 pb-4">
          {canInteract && (
            <Card className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <Icon
                    name={Number(user.id) === Number(deal.seller_id) ? 'Store' : 'ShoppingCart'}
                    size={18}
                    className="text-blue-300"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-300">
                    {Number(user.id) === Number(deal.seller_id) ? 'Вы - продавец' : 'Вы - покупатель'}
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    {getStepText(deal.step, Number(user.id) === Number(deal.seller_id))}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-gradient-to-br from-green-500/10 to-green-600/15 border-green-500/30">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/40 flex items-center justify-center flex-shrink-0">
                  <Icon name="Store" size={18} className="text-green-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground/70 mb-0.5">Продавец</p>
                  <p className="text-sm font-bold text-green-300 truncate">{deal.seller_name}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 bg-gradient-to-br from-amber-500/10 to-yellow-600/15 border-amber-500/30">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-600/40 flex items-center justify-center flex-shrink-0">
                  <Icon name="DollarSign" size={20} className="text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground/70 mb-0.5">Сумма</p>
                  <p className="text-lg font-black text-amber-300 truncate">
                    {deal.price} <span className="text-xs">USDT</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-3 bg-gradient-to-br from-muted/30 to-muted/10 min-h-[300px]">
            <div className="space-y-2">
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
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <Icon name="Info" size={12} className="text-blue-400" />
                      <p className="text-xs text-blue-400 font-semibold">{msg.message}</p>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] ${
                        msg.user_id === user?.id
                          ? 'bg-gradient-to-br from-green-800/40 to-green-900/30 border border-green-700/40'
                          : 'bg-gradient-to-br from-card to-muted/50 border border-border'
                      } p-2.5 rounded-2xl space-y-1`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Avatar className="w-5 h-5 ring-1 ring-border/50">
                          <AvatarImage src={msg.avatar_url} />
                          <AvatarFallback
                            className={`bg-gradient-to-br ${getAvatarGradient(msg.username || '')} text-white text-[9px]`}
                          >
                            {msg.username?.[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold truncate">{msg.username}</span>
                        <span className="text-[10px] text-muted-foreground/60 ml-auto">
                          {new Date(msg.created_at).toLocaleString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed break-words pl-6">{msg.message}</p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          {deal.status === 'active' && !deal.buyer_id && user && Number(user.id) !== Number(deal.seller_id) && (
            <Button
              onClick={handleBuyerPay}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 h-14 text-base font-bold rounded-xl"
            >
              <Icon
                name={actionLoading ? 'Loader2' : 'ShoppingCart'}
                size={18}
                className={`mr-2 ${actionLoading ? 'animate-spin' : ''}`}
              />
              {actionLoading ? 'Оплата...' : `Купить ${deal.price} USDT`}
            </Button>
          )}

          {deal.step === 'buyer_paid' && user && Number(user.id) === Number(deal.seller_id) && (
            <Button
              onClick={handleSellerSent}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 h-14 text-base font-bold rounded-xl"
            >
              <Icon name="Package" size={18} className="mr-2" />
              {actionLoading ? 'Обработка...' : 'Товар передан'}
            </Button>
          )}

          {deal.step === 'seller_sent' && user && Number(user.id) === Number(deal.buyer_id) && (
            <div className="space-y-3">
              <Card className="p-3 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="AlertCircle" size={16} className="text-orange-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-orange-300 mb-1">⚠️ Внимание!</p>
                    <p className="text-xs text-muted-foreground/80">
                      Подтверждайте только если получили товар! {deal.price} USDT будут переведены продавцу.
                    </p>
                  </div>
                </div>
              </Card>
              <Button
                onClick={handleBuyerConfirm}
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 h-14 text-base font-bold rounded-xl"
                type="button"
              >
                <Icon name="Check" size={18} className="mr-2" />
                {actionLoading ? 'Обработка...' : 'Подтвердить получение'}
              </Button>
            </div>
          )}

          {deal.status === 'completed' && (
            <Card className="p-4 bg-gradient-to-br from-green-800/15 to-green-900/25 border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="CheckCircle2" size={24} className="text-green-300" />
                </div>
                <div>
                  <h4 className="font-black text-green-300 text-base mb-1">Сделка завершена!</h4>
                  <p className="text-xs text-muted-foreground/80">
                    {user && Number(user.id) === Number(deal.seller_id)
                      ? `Вы получили ${(deal.price - deal.commission).toFixed(2)} USDT (комиссия ${deal.commission.toFixed(2)} USDT)`
                      : `Сделка успешно завершена`}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {!isCompleted && canInteract && (
        <div 
          className="bg-background border-t border-border/30"
          style={{
            flexShrink: 0,
            padding: '16px'
          }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Написать сообщение..."
              autoComplete="off"
              enterKeyHint="send"
              style={{
                flex: 1,
                height: '48px',
                padding: '0 16px',
                fontSize: '16px',
                borderRadius: '12px',
                border: '2px solid hsl(var(--input))',
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'hsl(var(--primary) / 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'hsl(var(--input))';
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              size="icon"
              className="h-12 w-12 rounded-xl flex-shrink-0 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 disabled:opacity-50"
              type="button"
            >
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
