import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { triggerNotificationUpdateImmediate } from '@/utils/notificationEvents';

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

interface AdminTicketsTabProps {
  tickets: SupportTicket[];
  currentUser: any;
  onRefresh: () => void;
  onUpdateTicketStatus: (ticketId: number, status: 'open' | 'answered' | 'closed') => void;
}

const AdminTicketsTab = ({ tickets, currentUser, onRefresh, onUpdateTicketStatus }: AdminTicketsTabProps) => {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'answered' | 'closed'>('all');

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

  const statusLabels: Record<string, { label: string; color: string }> = {
    open: { label: 'Открыт', color: 'text-yellow-500' },
    answered: { label: 'Отвечен', color: 'text-blue-500' },
    closed: { label: 'Закрыт', color: 'text-green-500' }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const handleAnswerTicket = async () => {
    if (!selectedTicket || !response.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите ответ',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(TICKETS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'answer',
          ticket_id: selectedTicket.id,
          admin_response: response.trim(),
          answered_by: currentUser.username
        })
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Ответ отправлен',
          description: 'Пользователь получит уведомление'
        });
        triggerNotificationUpdateImmediate(currentUser.id, currentUser.role);
        setResponse('');
        setSelectedTicket(null);
        onRefresh();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить ответ',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить ответ',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId: number) => {
    if (!confirm('Закрыть этот тикет?')) return;

    onUpdateTicketStatus(ticketId, 'closed');
    toast({
      title: 'Тикет закрыт',
      description: 'Тикет успешно закрыт'
    });
    setSelectedTicket(null);
  };

  const handleReopenTicket = async (ticketId: number) => {
    onUpdateTicketStatus(ticketId, 'open');
    toast({
      title: 'Тикет открыт',
      description: 'Тикет снова открыт для работы'
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Тикеты поддержки</h3>
          <p className="text-sm text-muted-foreground">
            Всего: {tickets.length} | Открытых: {tickets.filter(t => t.status === 'open').length}
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'open', 'answered', 'closed'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'Все' : statusLabels[status].label}
            </Button>
          ))}
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <Card className="p-4 sm:p-6 md:p-8 text-center">
          <Icon name="Inbox" size={36} className="mx-auto mb-4 text-muted-foreground sm:w-12 sm:h-12" />
          <p className="text-muted-foreground">Нет тикетов</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(ticket => (
            <Card key={ticket.id} className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <span className={`text-sm font-medium ${statusLabels[ticket.status].color}`}>
                        {statusLabels[ticket.status].label}
                      </span>
                      <span className="text-sm px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {categoryLabels[ticket.category] || ticket.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        #{ticket.id}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold mb-1">{ticket.subject}</h4>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                      <Icon name="User" size={14} />
                      <span>{ticket.username}</span>
                      <span>•</span>
                      <Icon name="Clock" size={14} />
                      <span>{new Date(ticket.created_at).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket);
                        setResponse('');
                      }}
                    >
                      <Icon name={selectedTicket?.id === ticket.id ? 'ChevronUp' : 'ChevronDown'} size={16} />
                      {selectedTicket?.id === ticket.id ? 'Свернуть' : 'Развернуть'}
                    </Button>
                  </div>
                </div>

                {selectedTicket?.id === ticket.id && (
                  <div className="pt-3 border-t space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Сообщение пользователя:</p>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
                      </div>
                    </div>

                    {ticket.admin_response && (
                      <div>
                        <p className="text-sm font-medium mb-2">Ваш ответ:</p>
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{ticket.admin_response}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Icon name="User" size={12} />
                            <span>{ticket.answered_by}</span>
                            <span>•</span>
                            <span>{ticket.answered_at && new Date(ticket.answered_at).toLocaleString('ru-RU')}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {ticket.status !== 'closed' && (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          {ticket.status === 'answered' ? 'Дополнительный ответ:' : 'Ответ:'}
                        </p>
                        <Textarea
                          placeholder="Введите ваш ответ пользователю..."
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          rows={4}
                          disabled={isSubmitting}
                        />
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={handleAnswerTicket}
                            disabled={isSubmitting || !response.trim()}
                            size="sm"
                          >
                            <Icon name="Send" size={16} />
                            Отправить ответ
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleCloseTicket(ticket.id)}
                            disabled={isSubmitting}
                            size="sm"
                          >
                            <Icon name="Check" size={16} />
                            Закрыть тикет
                          </Button>
                        </div>
                      </div>
                    )}

                    {ticket.status === 'closed' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleReopenTicket(ticket.id)}
                          size="sm"
                        >
                          <Icon name="RotateCcw" size={16} />
                          Открыть заново
                        </Button>
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

export default AdminTicketsTab;