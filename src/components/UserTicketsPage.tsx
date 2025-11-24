import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

const TICKETS_URL = 'https://functions.poehali.dev/f2a5cbce-6afc-4ef1-91a6-f14075db8567';

interface SupportTicket {
  id: number;
  user_id: number;
  username: string;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  created_at: string;
  admin_response?: string;
  answered_at?: string;
  answered_by?: string;
}

interface UserTicketsPageProps {
  user: User;
}

const UserTicketsPage = ({ user }: UserTicketsPageProps) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const categoryLabels: Record<string, string> = {
    account: 'Аккаунт',
    payment: 'Платежи',
    games: 'Игры',
    garant: 'Гарант сделка',
    flash: 'Flash USDT',
    complaint: 'Жалобы, обман',
    forum: 'Форум',
    technical: 'Технические',
    other: 'Другое'
  };

  const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    open: { label: 'Открыт', color: 'text-yellow-500 bg-yellow-500/20', icon: 'Clock' },
    answered: { label: 'Отвечен', color: 'text-blue-500 bg-blue-500/20', icon: 'MessageCircle' },
    closed: { label: 'Закрыт', color: 'text-green-500 bg-green-500/20', icon: 'CheckCircle' }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const loadTickets = async () => {
    try {
      const response = await fetch(`${TICKETS_URL}?action=user_tickets&user_id=${user.id}`, {
        headers: { 'X-User-Id': user.id.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки тикетов:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">📬 Мои обращения</h1>
        <p className="text-muted-foreground">
          Здесь вы можете отслеживать статус ваших обращений в поддержку
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Icon name="Clock" size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
              <p className="text-xs text-muted-foreground">Ожидают ответа</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Icon name="MessageCircle" size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'answered').length}</p>
              <p className="text-xs text-muted-foreground">Получен ответ</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Icon name="CheckCircle" size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'closed').length}</p>
              <p className="text-xs text-muted-foreground">Закрыто</p>
            </div>
          </div>
        </Card>
      </div>

      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="Inbox" size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">У вас пока нет обращений</h3>
          <p className="text-muted-foreground mb-4">
            Если у вас возникнут вопросы, создайте тикет в разделе "Поддержка"
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id}
              className={`p-4 transition-all hover:shadow-lg ${
                selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusLabels[ticket.status].color}`}>
                        <Icon name={statusLabels[ticket.status].icon as any} size={14} />
                        {statusLabels[ticket.status].label}
                      </span>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {categoryLabels[ticket.category] || ticket.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        #{ticket.id}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{ticket.subject}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      {new Date(ticket.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                  >
                    <Icon name={selectedTicket?.id === ticket.id ? 'ChevronUp' : 'ChevronDown'} size={16} />
                  </Button>
                </div>

                {selectedTicket?.id === ticket.id && (
                  <div className="pt-3 border-t space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Icon name="User" size={14} />
                        Ваше сообщение:
                      </p>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
                      </div>
                    </div>

                    {ticket.admin_response ? (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Icon name="Headphones" size={14} className="text-primary" />
                          Ответ поддержки:
                        </p>
                        <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                          <p className="text-sm whitespace-pre-wrap mb-2">{ticket.admin_response}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon name="User" size={12} />
                            <span>{ticket.answered_by}</span>
                            <span>•</span>
                            <Icon name="Clock" size={12} />
                            <span>{ticket.answered_at && new Date(ticket.answered_at).toLocaleString('ru-RU')}</span>
                          </div>
                        </div>
                      </div>
                    ) : ticket.status === 'closed' ? (
                      <div className="bg-muted/50 border border-border p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon name="CheckCircle" size={16} />
                          <span>Тикет закрыт администратором без ответа</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                          <Icon name="Clock" size={16} />
                          <span>Ожидаем ответа от администратора...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserTicketsPage;