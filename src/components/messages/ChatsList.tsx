import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { getAvatarGradient } from '@/utils/avatarColors';

interface Chat {
  userId: number;
  username: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatsListProps {
  chats: Chat[];
  loading: boolean;
  onChatSelect: (chatUserId: number) => void;
  onNewChat: () => void;
  formatTime: (dateString: string) => string;
}

export const ChatsList = ({ chats, loading, onChatSelect, onNewChat, formatTime }: ChatsListProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="MessageSquare" size={24} className="text-primary" />
          <h2 className="text-xl font-bold">Сообщения</h2>
        </div>
        <Button onClick={onNewChat} size="sm" variant="outline">
          <Icon name="Plus" size={18} className="mr-2" />
          Новый чат
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Icon name="Loader2" size={24} className="animate-spin text-primary" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Icon name="Inbox" size={48} className="mb-2 opacity-50" />
            <p>Нет сообщений</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {chats.map((chat) => (
              <div
                key={chat.userId}
                className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => onChatSelect(chat.userId)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    {chat.avatar ? (
                      <AvatarImage src={chat.avatar} alt={chat.username} />
                    ) : (
                      <AvatarFallback className={getAvatarGradient(chat.userId)}>
                        {chat.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold truncate">{chat.username}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <Badge variant="default" className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
