import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Message } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ChatsList } from './messages/ChatsList';
import { ChatView } from './messages/ChatView';
import { NewChatDialog } from './messages/NewChatDialog';

const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';
const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface MessagesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  initialRecipientId?: number | null;
}

interface Chat {
  userId: number;
  username: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const MessagesPanel = ({ open, onOpenChange, userId, initialRecipientId }: MessagesPanelProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [currentChatMessages, setCurrentChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  useEffect(() => {
    if (open) {
      fetchMessages();
      if (initialRecipientId) {
        setSelectedChat(initialRecipientId);
        setShowChatList(false);
      }
    }
  }, [open, initialRecipientId]);

  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      const chatMessages = messages.filter(
        m => (m.from_user_id === selectedChat && m.to_user_id === userId) ||
             (m.from_user_id === userId && m.to_user_id === selectedChat)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      setCurrentChatMessages(chatMessages);
      
      chatMessages.forEach(msg => {
        if (!msg.is_read && msg.to_user_id === userId) {
          markMessageRead(msg.id);
        }
      });
    }
  }, [selectedChat, messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NOTIFICATIONS_URL}?action=messages`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        buildChats(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildChats = (allMessages: Message[]) => {
    const chatsMap = new Map<number, Chat>();

    allMessages.forEach(msg => {
      const otherUserId = msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id;
      const otherUsername = msg.from_user_id === userId ? msg.to_username : msg.from_username;
      const otherAvatar = msg.from_user_id === userId ? undefined : msg.from_avatar;

      if (!chatsMap.has(otherUserId)) {
        chatsMap.set(otherUserId, {
          userId: otherUserId,
          username: otherUsername,
          avatar: otherAvatar,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0
        });
      }

      const chat = chatsMap.get(otherUserId)!;
      const msgTime = new Date(msg.created_at).getTime();
      const lastMsgTime = new Date(chat.lastMessageTime).getTime();

      if (msgTime > lastMsgTime) {
        chat.lastMessage = msg.content;
        chat.lastMessageTime = msg.created_at;
      }

      if (msg.to_user_id === userId && !msg.is_read) {
        chat.unreadCount++;
      }
    });

    const chatsList = Array.from(chatsMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    setChats(chatsList);
  };

  const markMessageRead = async (messageId: number) => {
    try {
      await fetch(NOTIFICATIONS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({ action: 'mark_message_read', message_id: messageId })
      });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessageText.trim()) return;

    try {
      const response = await fetch(NOTIFICATIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          action: 'send_message',
          to_user_id: selectedChat,
          subject: 'Сообщение',
          content: newMessageText.trim()
        })
      });

      if (response.ok) {
        setNewMessageText('');
        await fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const startNewChat = async () => {
    if (!newChatUsername.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите никнейм пользователя',
        variant: 'destructive'
      });
      return;
    }

    setSearchingUser(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          action: 'search_user',
          username: newChatUsername.trim()
        })
      });

      const data = await response.json();

      if (!data.success) {
        toast({
          title: 'Пользователь не найден',
          description: `Пользователь с никнеймом "${newChatUsername}" не существует`,
          variant: 'destructive'
        });
        return;
      }

      const targetUser = data.user;

      if (targetUser.id === userId) {
        toast({
          title: 'Ошибка',
          description: 'Нельзя начать чат с самим собой',
          variant: 'destructive'
        });
        return;
      }

      setSelectedChat(targetUser.id);
      setShowNewChat(false);
      setNewChatUsername('');
      setShowChatList(false);
      
      toast({
        title: 'Чат найден',
        description: `Открыт чат с пользователем ${targetUser.username}`
      });
    } catch (error) {
      console.error('Failed to search user:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось найти пользователя',
        variant: 'destructive'
      });
    } finally {
      setSearchingUser(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else if (diffDays === 1) {
      return 'вчера';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const handleChatSelect = (chatUserId: number) => {
    setSelectedChat(chatUserId);
    setShowChatList(false);
  };

  const handleBackToChatList = () => {
    setShowChatList(true);
  };

  const selectedChatData = chats.find(c => c.userId === selectedChat);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <div className="grid lg:grid-cols-[320px_1fr] h-full">
            <div className={`${showChatList ? 'block' : 'hidden lg:block'} border-r border-border h-full`}>
              <ChatsList
                chats={chats}
                loading={loading}
                onChatSelect={handleChatSelect}
                onNewChat={() => setShowNewChat(true)}
                formatTime={formatTime}
              />
            </div>

            <div className={`${!showChatList ? 'block' : 'hidden lg:block'} h-full`}>
              {selectedChat ? (
                <ChatView
                  selectedChat={selectedChatData}
                  currentChatMessages={currentChatMessages}
                  newMessageText={newMessageText}
                  onMessageChange={setNewMessageText}
                  onSendMessage={sendMessage}
                  onBackToList={handleBackToChatList}
                  userId={userId}
                  formatTime={formatTime}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-primary"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold">Выберите чат</p>
                    <p className="text-sm">Начните общение с пользователями</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NewChatDialog
        open={showNewChat}
        onOpenChange={setShowNewChat}
        newChatUsername={newChatUsername}
        onUsernameChange={setNewChatUsername}
        onSubmit={startNewChat}
        searching={searchingUser}
      />
    </>
  );
};

export default MessagesPanel;
