import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface LotteryTicket {
  id: number;
  user_id: number;
  username: string;
  ticket_number: number;
  purchased_at: string;
}

interface LotteryHistory {
  id: number;
  status: string;
  total_tickets: number;
  prize_pool: number;
  winner_ticket_number: number;
  winner_user_id: number;
  winner_username: string;
  created_at: string;
  completed_at: string;
}

interface LotteryParticipantsProps {
  tickets: LotteryTicket[];
  maxTickets: number;
  ticketPrice: number;
  showHistory: boolean;
  history: LotteryHistory[];
  prizeAmount: number;
  onToggleHistory: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const LotteryParticipants = ({
  tickets,
  maxTickets,
  ticketPrice,
  showHistory,
  history,
  prizeAmount,
  onToggleHistory
}: LotteryParticipantsProps) => {
  const ticketsByUser = tickets.reduce((acc, ticket) => {
    acc[ticket.username] = (acc[ticket.username] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <Card className="p-6 bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Icon name="Users" size={20} className="text-indigo-400" />
            Участники ({tickets.length}/{maxTickets})
          </h3>
          <Button
            type="button"
            onClick={onToggleHistory}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Icon name="History" size={16} />
            {showHistory ? 'Скрыть' : 'История'}
          </Button>
        </div>
        
        {tickets.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Пока нет участников. Купите первый билет!</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(ticketsByUser).map(([username, count]) => {
              const userTicketNumbers = tickets
                .filter(t => t.username === username)
                .map(t => t.ticket_number);
              
              return (
                <div
                  key={username}
                  className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center">
                      <Icon name="User" size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{username}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} билет{count > 1 ? 'а' : ''} ({userTicketNumbers.join(', ')})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-400">{count}x</p>
                    <p className="text-xs text-muted-foreground">{(count * ticketPrice).toFixed(0)} USDT</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showHistory && (
        <Card className="p-6 bg-card/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="History" size={20} className="text-yellow-400" />
            История победителей
          </h3>
          
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">История пуста</p>
          ) : (
            <div className="space-y-3">
              {history.map((round) => (
                <Card key={round.id} className="p-4 bg-card/80 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                        <Icon name="Trophy" size={24} className="text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-400">{round.winner_username}</p>
                        <p className="text-xs text-muted-foreground">
                          Билет #{round.winner_ticket_number} • {formatDate(round.completed_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">{prizeAmount} USDT</p>
                      <p className="text-xs text-muted-foreground">{round.total_tickets} участников</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default LotteryParticipants;