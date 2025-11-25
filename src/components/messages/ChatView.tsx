import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { Message } from '@/types';
import { getAvatarGradient } from '@/utils/avatarColors';

interface Chat {
  userId: number;
  username: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatViewProps {
  selectedChat: Chat | undefined;
  currentChatMessages: Message[];
  newMessageText: string;
  onMessageChange: (text: string) => void;
  onSendMessage: () => void;
  onBackToList: () => void;
  userId: number;
  formatTime: (dateString: string) => string;
}

export const ChatView = ({
  selectedChat,
  currentChatMessages,
  newMessageText,
  onMessageChange,
  onSendMessage,
  onBackToList,
  userId,
  formatTime
}: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isSafariBrowser = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium');
    setIsSafari(isSafariBrowser);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const vHeight = window.visualViewport.height;
        const wHeight = window.innerHeight;
        const kbHeight = wHeight - vHeight;
        setKeyboardHeight(kbHeight);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChatMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const handleInputFocus = () => {
    // Не делаем ничего - позволяем браузеру естественно показать поле ввода
  };

  const handleSend = () => {
    if (newMessageText.trim()) {
      onSendMessage();
      if (inputRef.current) {
        inputRef.current.blur();
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  };

  if (!selectedChat) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 flex items-center gap-3 p-3 sm:p-4 border-b border-border/30 bg-background">
        <Button 
          onClick={onBackToList} 
          size="icon" 
          variant="ghost" 
          className="lg:hidden w-9 h-9 touch-manipulation"
          style={{ touchAction: 'manipulation' }}
        >
          <Icon name="ArrowLeft" size={20} />
        </Button>
        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-border/30">
          {selectedChat.avatar ? (
            <AvatarImage src={selectedChat.avatar} alt={selectedChat.username} />
          ) : (
            <AvatarFallback className={getAvatarGradient(selectedChat.userId)}>
              {selectedChat.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base truncate">{selectedChat.username}</h3>
        </div>
      </div>

      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollPaddingBottom: '80px'
        }}
      >
        {currentChatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Icon name="MessageCircle" size={48} className="mb-2 opacity-50" />
            <p>Нет сообщений</p>
            <p className="text-sm">Начните общение</p>
          </div>
        ) : (
          currentChatMessages.map((msg) => {
            const isMyMessage = msg.from_user_id === userId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {msg.from_avatar ? (
                    <AvatarImage src={msg.from_avatar} alt={msg.from_username} />
                  ) : (
                    <AvatarFallback className={getAvatarGradient(msg.from_user_id)}>
                      {msg.from_username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className={`flex-1 ${isMyMessage ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${
                    isMyMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 bg-background border-t border-border/30 p-3 sm:p-4 safe-area-bottom">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            inputMode="text"
            value={newMessageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="Введите сообщение..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 h-11 sm:h-12 px-4 rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
            style={{ 
              fontSize: '16px',
              WebkitUserSelect: 'text',
              userSelect: 'text'
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessageText.trim()}
            size="icon"
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex-shrink-0 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation disabled:opacity-50"
            style={{ touchAction: 'manipulation' }}
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};