import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  from_username: string;
  to_username: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface AdminMessagesTabProps {
  currentUser: any;
  onRefresh: () => void;
}

const AdminMessagesTab = ({ currentUser, onRefresh }: AdminMessagesTabProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<{user1: string, user2: string} | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4?action=messages',
        {
          headers: {
            'X-User-Id': currentUser.id.toString()
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [currentUser.id]);

  const filteredMessages = messages.filter(msg => {
    const query = searchQuery.toLowerCase();
    return (
      msg.from_username?.toLowerCase().includes(query) ||
      msg.to_username?.toLowerCase().includes(query) ||
      msg.subject?.toLowerCase().includes(query) ||
      msg.content?.toLowerCase().includes(query)
    );
  });

  const conversationMessages = selectedConversation 
    ? filteredMessages.filter(msg => 
        (msg.from_username === selectedConversation.user1 && msg.to_username === selectedConversation.user2) ||
        (msg.from_username === selectedConversation.user2 && msg.to_username === selectedConversation.user1)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const conversations = Array.from(
    new Set(
      filteredMessages.map(msg => {
        const users = [msg.from_username, msg.to_username].sort();
        return `${users[0]}|${users[1]}`;
      })
    )
  ).map(key => {
    const [user1, user2] = key.split('|');
    const msgs = filteredMessages.filter(msg => 
      (msg.from_username === user1 && msg.to_username === user2) ||
      (msg.from_username === user2 && msg.to_username === user1)
    );
    const lastMsg = msgs.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    
    return {
      user1,
      user2,
      lastMessage: lastMsg,
      messageCount: msgs.length
    };
  }).sort((a, b) => 
    new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon name="MessageSquare" size={20} />
          Личные сообщения ({messages.length})
        </h3>
        <button
          onClick={() => { loadMessages(); onRefresh(); }}
          className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          title="Обновить"
        >
          <Icon name="RefreshCw" size={18} />
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по пользователям или сообщениям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-background/50 border border-border rounded-lg p-2 max-h-[600px] overflow-y-auto">
          <h4 className="text-sm font-semibold text-muted-foreground px-2 py-1 mb-2">
            Переписки ({conversations.length})
          </h4>
          
          {conversations.map((conv) => (
            <button
              key={`${conv.user1}-${conv.user2}`}
              onClick={() => setSelectedConversation({ user1: conv.user1, user2: conv.user2 })}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                selectedConversation?.user1 === conv.user1 && selectedConversation?.user2 === conv.user2
                  ? 'bg-primary/20 border border-primary/50'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {conv.user1} ↔ {conv.user2}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {conv.lastMessage.content.substring(0, 50)}...
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(conv.lastMessage.created_at)}
                  </span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {conv.messageCount}
                  </span>
                </div>
              </div>
            </button>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Переписок не найдено
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-background/50 border border-border rounded-lg">
          {selectedConversation ? (
            <div className="flex flex-col h-[600px]">
              <div className="border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="MessageCircle" size={18} />
                  <h4 className="font-semibold">
                    {selectedConversation.user1} ↔ {selectedConversation.user2}
                  </h4>
                </div>
                <span className="text-sm text-muted-foreground">
                  {conversationMessages.length} сообщений
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.from_username === selectedConversation.user1
                        ? 'bg-primary/10 ml-auto max-w-[80%]'
                        : 'bg-muted/50 mr-auto max-w-[80%]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-primary">
                        {msg.from_username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    {msg.subject && (
                      <div className="text-sm font-semibold mb-1">{msg.subject}</div>
                    )}
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                    {!msg.is_read && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Icon name="Circle" size={8} className="fill-current" />
                        Не прочитано
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center text-muted-foreground">
              <Icon name="MessageSquare" size={48} className="mb-4 opacity-50" />
              <p>Выберите переписку для просмотра</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesTab;
