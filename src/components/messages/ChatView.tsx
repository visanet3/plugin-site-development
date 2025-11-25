import { useRef, useEffect } from 'react';
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

  useEffect(() => {
    scrollToBottom();
  }, [currentChatMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (!selectedChat) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button onClick={onBackToList} size="icon" variant="ghost" className="lg:hidden">
          <Icon name="ArrowLeft" size={20} />
        </Button>
        <Avatar className="w-10 h-10">
          {selectedChat.avatar ? (
            <AvatarImage src={selectedChat.avatar} alt={selectedChat.username} />
          ) : (
            <AvatarFallback className={getAvatarGradient(selectedChat.userId)}>
              {selectedChat.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h3 className="font-semibold">{selectedChat.username}</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessageText}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Введите сообщение..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage();
              }
            }}
          />
          <Button onClick={onSendMessage} disabled={!newMessageText.trim()}>
            <Icon name="Send" size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};
