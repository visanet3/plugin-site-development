import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Icon from '@/components/ui/icon';
import { Message } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getAvatarGradient } from '@/utils/avatarColors';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSafari, setIsSafari] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isSafariBrowser = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium');
    setIsSafari(isSafariBrowser);
    
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

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
      scrollToBottom();
      
      chatMessages.forEach(msg => {
        if (!msg.is_read && msg.to_user_id === userId) {
          markMessageRead(msg.id);
        }
      });
    }
  }, [selectedChat, messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

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

  const handleInputFocus = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  const handleSend = () => {
    if (newMessageText.trim() && !isSending) {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessageText.trim() || isSending) return;

    setIsSending(true);
    const messageToSend = newMessageText.trim();
    setNewMessageText('');

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
          content: messageToSend
        })
      });

      if (response.ok) {
        await fetchMessages();
        scrollToBottom();
      } else {
        setNewMessageText(messageToSend);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessageText(messageToSend);
    } finally {
      setIsSending(false);
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

  const handleBackToChats = () => {
    setShowChatList(true);
    setSelectedChat(null);
  };

  const selectedChatInfo = chats.find(c => c.userId === selectedChat);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-4xl md:max-w-5xl h-[100vh] sm:h-[90vh] p-0 sm:rounded-lg overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Сообщения</DialogTitle>
        </VisuallyHidden>
        <div className="flex h-full bg-background">
          {/* Список чатов - показывается на мобилке когда чат не выбран */}
          <div className={`${showChatList ? 'flex' : 'hidden sm:flex'} w-full sm:w-80 md:w-96 flex-col border-r border-border relative`}>
            {/* Шапка списка чатов */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <h2 className="text-xl font-semibold">Чаты</h2>
            </div>
            
            {/* Баннер для мобильных */}
            {!isDesktop && (
              <div className="px-4 py-3 border-b border-border bg-blue-500/10">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="Monitor" size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-400 mb-1">💻 Доступно только на ПК</p>
                    <p className="text-xs text-muted-foreground/80">
                      Отправка сообщений доступна только с компьютера
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Новый чат форма */}
            {showNewChat && (
              <div className="px-4 py-3 border-b border-border bg-muted/20">
                <div className="space-y-2">
                  <Input
                    placeholder="Никнейм пользователя"
                    type="text"
                    inputMode="text"
                    value={newChatUsername}
                    onChange={(e) => setNewChatUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !searchingUser && startNewChat()}
                    className="h-10 transition-all focus:scale-[1.01]"
                    style={{ fontSize: '16px' }}
                    autoComplete="off"
                    autoCorrect="off"
                    disabled={searchingUser}
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={startNewChat} 
                      className="flex-1 touch-manipulation transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{ touchAction: 'manipulation' }}
                      disabled={searchingUser}
                    >
                      {searchingUser ? (
                        <>
                          <Icon name="Loader2" size={14} className="animate-spin mr-2" />
                          Поиск...
                        </>
                      ) : (
                        'Начать'
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setShowNewChat(false);
                        setNewChatUsername('');
                      }}
                      className="touch-manipulation transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{ touchAction: 'manipulation' }}
                      disabled={searchingUser}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Список чатов */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
                </div>
              ) : chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-muted-foreground">
                  <Icon name="MessageCircle" size={48} className="mb-3 opacity-50" />
                  <p className="text-sm">Нет сообщений</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.userId}
                    onClick={() => handleChatSelect(chat.userId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted/70 transition-all duration-200 border-b border-border/50 touch-manipulation ${
                      selectedChat === chat.userId ? 'bg-muted' : ''
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(chat.username)} text-white font-semibold`}>
                        {chat.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold truncate">{chat.username}</p>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {chat.lastMessage}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Плавающая кнопка добавления чата */}
            <Button
              size="icon"
              onClick={() => setShowNewChat(true)}
              className="absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation z-10"
              style={{ touchAction: 'manipulation' }}
            >
              <Icon name="Plus" size={24} />
            </Button>
          </div>

          {/* Окно чата */}
          <div className={`${!showChatList ? 'flex' : 'hidden sm:flex'} flex-1 flex-col`}>
            {selectedChat ? (
              <>
                {/* Шапка чата */}
                <div className="flex-shrink-0 flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-border/30 bg-background min-h-[60px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToChats}
                    className="sm:hidden h-9 w-9 flex-shrink-0 touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <Icon name="ArrowLeft" size={20} />
                  </Button>
                  <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 ring-2 ring-border/30">
                    <AvatarImage src={selectedChatInfo?.avatar} />
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(selectedChatInfo?.username || '')} text-white font-semibold`}>
                      {selectedChatInfo?.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 overflow-hidden py-1">
                    <p className="font-semibold truncate text-sm sm:text-base">{selectedChatInfo?.username}</p>
                    <p className="text-xs text-muted-foreground/70 truncate">ID: {selectedChat}</p>
                  </div>
                </div>

                {/* Сообщения */}
                {isSafari && (
                  <Card className="m-3 p-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 flex-shrink-0">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="AlertTriangle" size={12} className="text-orange-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-orange-300 mb-0.5">⚠️ Safari</p>
                        <p className="text-[10px] text-muted-foreground/80 leading-tight">
                          Чат может работать некорректно в Safari. Рекомендуем Chrome или Firefox.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
                <div 
                  ref={contentRef}
                  className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-2 bg-muted/5"
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    scrollPaddingBottom: '80px'
                  }}
                >
                  {currentChatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Icon name="MessageCircle" size={48} className="mb-3 opacity-50" />
                      <p className="text-sm">Начните общение</p>
                    </div>
                  ) : (
                    currentChatMessages.map((msg, index) => {
                      const isMyMessage = msg.from_user_id === userId;
                      const showDate = index === 0 || 
                        new Date(currentChatMessages[index - 1].created_at).toDateString() !== 
                        new Date(msg.created_at).toDateString();

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-3">
                              <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                                {new Date(msg.created_at).toLocaleDateString('ru-RU', { 
                                  day: 'numeric', 
                                  month: 'long' 
                                })}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-1`}>
                            <div className={`max-w-[85%] sm:max-w-[70%] ${
                              isMyMessage 
                                ? 'bg-primary text-primary-foreground rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl' 
                                : 'bg-muted rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl'
                            } px-3 py-2 shadow-sm`}>
                              <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className={`text-[10px] ${isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {formatTime(msg.created_at)}
                                </span>
                                {isMyMessage && (
                                  <Icon 
                                    name={msg.is_read ? 'CheckCheck' : 'Check'} 
                                    size={14} 
                                    className={msg.is_read ? 'text-blue-400' : 'text-primary-foreground/70'} 
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Поле ввода */}
                <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border/30 bg-background safe-area-bottom">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      type="text"
                      inputMode="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      onFocus={handleInputFocus}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={isDesktop ? "Введите сообщение..." : "Доступно только на ПК"}
                      disabled={!isDesktop}
                      className="flex-1 h-11 sm:h-12 px-4 rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={!newMessageText.trim() || isSending || !isDesktop}
                      size="icon"
                      className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex-shrink-0 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation disabled:opacity-50"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Icon name={isSending ? "Loader2" : "Send"} size={18} className={isSending ? "animate-spin" : ""} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex flex-col items-center justify-center h-full text-muted-foreground">
                <Icon name="MessageCircle" size={64} className="mb-4 opacity-30" />
                <p className="text-lg">Выберите чат</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagesPanel;