import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import MessagesChatItem from './MessagesChatItem';
import { useToast } from '@/hooks/use-toast';
import { AUTH_URL } from '@/lib/api-urls';

interface Chat {
  userId: number;
  username: string;
  avatar?: string;
  role?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  lastSeenAt?: string;
}

interface MessagesChatListProps {
  chats: Chat[];
  selectedChat: number | null;
  userId: number;
  userRole: string;
  loading: boolean;
  onChatSelect: (chatUserId: number) => void;
  onNewChatCreated: (recipientId: number) => void;
  onUserClick?: (userId: number) => void;
}

const MessagesChatList = ({
  chats,
  selectedChat,
  userId,
  userRole,
  loading,
  onChatSelect,
  onNewChatCreated,
  onUserClick
}: MessagesChatListProps) => {
  const { toast } = useToast();
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [filteredChats, setFilteredChats] = useState<Chat[]>(chats);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredChats(chats.filter(chat => 
        chat.username.toLowerCase().includes(query)
      ));
    } else {
      setFilteredChats(chats);
    }
  }, [searchQuery, chats]);

  const handleCreateNewChat = async () => {
    if (!newChatUsername.trim()) {
      toast({ title: 'Ошибка', description: 'Введите имя пользователя', variant: 'destructive' });
      return;
    }

    setSearchingUser(true);
    try {
      const response = await fetch(`${AUTH_URL}?action=find_user&username=${encodeURIComponent(newChatUsername)}`, {
        headers: { 'X-User-Id': userId.toString() }
      });

      const data = await response.json();

      if (data.user) {
        if (data.user.id === userId) {
          toast({ title: 'Ошибка', description: 'Нельзя начать чат с самим собой', variant: 'destructive' });
        } else {
          onNewChatCreated(data.user.id);
          setShowNewChat(false);
          setNewChatUsername('');
        }
      } else {
        toast({ title: 'Ошибка', description: 'Пользователь не найден', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось найти пользователя', variant: 'destructive' });
    } finally {
      setSearchingUser(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Icon name="MessageSquare" size={20} />
            Сообщения
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewChat(!showNewChat)}
            className="flex-shrink-0"
          >
            <Icon name={showNewChat ? "X" : "Plus"} size={20} />
          </Button>
        </div>

        {showNewChat && (
          <div className="space-y-2 mb-3">
            <Input
              placeholder="Имя пользователя"
              value={newChatUsername}
              onChange={(e) => setNewChatUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateNewChat()}
            />
            <Button
              onClick={handleCreateNewChat}
              disabled={searchingUser}
              className="w-full"
              size="sm"
            >
              {searchingUser ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Поиск...
                </>
              ) : (
                <>
                  <Icon name="Search" size={16} className="mr-2" />
                  Найти пользователя
                </>
              )}
            </Button>
          </div>
        )}

        {chats.length > 0 && (
          <Input
            placeholder="Поиск по чатам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Icon name="MessageSquare" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Чаты не найдены' : 'Нет сообщений'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Начните новый чат, нажав на кнопку "+"
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredChats.map(chat => (
              <MessagesChatItem
                key={chat.userId}
                userId={chat.userId}
                username={chat.username}
                avatar={chat.avatar}
                role={chat.role}
                lastMessage={chat.lastMessage}
                lastMessageTime={chat.lastMessageTime}
                unreadCount={chat.unreadCount}
                isSelected={selectedChat === chat.userId}
                onClick={() => onChatSelect(chat.userId)}
                onUserClick={onUserClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesChatList;