import { Deal, User } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { getAvatarGradient } from '@/utils/avatarColors';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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
  const portalRoot = useRef<HTMLDivElement | null>(null);

  // Создание изолированного Portal контейнера
  useEffect(() => {
    // Создаём отдельный контейнер для Portal
    const container = document.createElement('div');
    container.id = 'deal-dialog-portal';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    container.style.isolation = 'isolate'; // Полная изоляция от родителя
    
    document.body.appendChild(container);
    portalRoot.current = container;

    // Блокируем скролл body
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      // Удаляем Portal контейнер
      if (portalRoot.current && document.body.contains(portalRoot.current)) {
        document.body.removeChild(portalRoot.current);
      }
      
      // Восстанавливаем body
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dealMessages]);

  // Блокируем потерю фокуса input при скролле
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      // Разрешаем скролл, но не даём убрать фокус с input
      if (inputRef.current && document.activeElement === inputRef.current) {
        e.stopPropagation();
      }
    };

    const container = portalRoot.current;
    if (container) {
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      return () => container.removeEventListener('touchmove', handleTouchMove);
    }
  }, []);

  // Весь контент диалога
  const dialogContent = (
    <div 
      className="fixed inset-0 bg-background overflow-y-auto"
      style={{
        touchAction: 'pan-y',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="min-h-screen p-4 space-y-3 pb-32">
        {/* Header with close button */}
        <div className="flex items-center gap-3 pb-2">
          <button
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center active:scale-95 transition-all"
            type="button"
          >
            <Icon name="X" size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate">{deal.title}</h2>
            <p className="text-xs text-muted-foreground truncate">{deal.description}</p>
          </div>
        </div>

        {/* User role */}
        {user && (Number(user.id) === Number(deal.seller_id) || Number(user.id) === Number(deal.buyer_id)) && (
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

        {/* Info cards */}
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

        {/* Chat */}
        <Card className="p-3 bg-gradient-to-br from-muted/30 to-muted/10 min-h-[300px]">
          <div className="space-y-2 pb-4">
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

        {/* Action buttons */}
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

      {/* Input - sticky at bottom */}
      {deal.status !== 'completed' &&
        deal.status !== 'cancelled' &&
        user &&
        (Number(user.id) === Number(deal.seller_id) || Number(user.id) === Number(deal.buyer_id)) && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/30 p-4 z-50">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => {
                  console.log('Input onChange:', e.target.value);
                  setNewMessage(e.target.value);
                }}
                onInput={(e) => {
                  console.log('Input onInput:', (e.target as HTMLInputElement).value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMessage.trim()) {
                    sendMessage();
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  inputRef.current?.focus();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.focus();
                }}
                onFocus={() => console.log('Input focused')}
                onBlur={(e) => {
                  console.log('Input blurred');
                  // Не даём потерять фокус при скролле
                  setTimeout(() => {
                    if (inputRef.current && document.activeElement !== inputRef.current) {
                      inputRef.current.focus();
                    }
                  }, 100);
                }}
                placeholder="Написать сообщение..."
                className="flex-1 h-12 px-4 text-base rounded-xl border-2 border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                autoComplete="off"
                style={{ 
                  fontSize: '16px', 
                  touchAction: 'manipulation', 
                  WebkitUserSelect: 'text', 
                  userSelect: 'text',
                  pointerEvents: 'auto'
                }}
              />
              <Button
                onClick={() => {
                  if (newMessage.trim()) {
                    sendMessage();
                  }
                }}
                size="icon"
                className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 h-12 w-12 rounded-xl flex-shrink-0"
                type="button"
              >
                <Icon name="Send" size={18} />
              </Button>
            </div>
          </div>
        )}
    </div>
  );

  // Рендерим через Portal в изолированный контейнер
  if (!portalRoot.current) return null;
  return createPortal(dialogContent, portalRoot.current);
};