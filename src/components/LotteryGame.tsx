import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface LotteryGameProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

interface LotteryTicket {
  id: number;
  user_id: number;
  username: string;
  ticket_number: number;
  purchased_at: string;
}

interface LotteryRound {
  id: number;
  status: 'active' | 'drawing' | 'completed';
  total_tickets: number;
  prize_pool: number;
  draw_time: string | null;
  winner_ticket_number: number | null;
  winner_username: string | null;
  created_at: string;
}

interface ChatMessage {
  id: number;
  user_id: number;
  username: string;
  message: string;
  created_at: string;
}

interface LotteryNotification {
  id: number;
  round_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
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

const TICKET_PRICE = 50;
const MAX_TICKETS = 10;
const DRAW_DELAY_MINUTES = 1;
const PRIZE_AMOUNT = 400;

const LotteryGame = ({ user, onShowAuthDialog, onRefreshUserBalance }: LotteryGameProps) => {
  const { toast } = useToast();
  const [currentRound, setCurrentRound] = useState<LotteryRound | null>(null);
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [myTickets, setMyTickets] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<LotteryNotification[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<LotteryHistory[]>([]);

  useEffect(() => {
    loadLottery();
    loadChat();
    checkDraw();
    if (user) {
      loadNotifications();
    }
    const lotteryInterval = setInterval(loadLottery, 5000);
    const chatInterval = setInterval(loadChat, 3000);
    const drawInterval = setInterval(checkDraw, 10000);
    const notifInterval = user ? setInterval(loadNotifications, 10000) : null;
    return () => {
      clearInterval(lotteryInterval);
      clearInterval(chatInterval);
      clearInterval(drawInterval);
      if (notifInterval) clearInterval(notifInterval);
    };
  }, [user]);

  useEffect(() => {
    if (currentRound?.draw_time && currentRound.status === 'drawing') {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const drawTime = new Date(currentRound.draw_time!).getTime();
        const diff = drawTime - now;

        if (diff <= 0) {
          setTimeLeft('Идет розыгрыш...');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentRound]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadLottery = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'X-User-Id': user.id.toString() } : {})
        },
        body: JSON.stringify({
          action: 'get_lottery'
        })
      });

      if (!response.ok) {
        console.error('Failed to load lottery:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setCurrentRound(data.round);
        setTickets(data.tickets || []);
        if (user) {
          const userTickets = (data.tickets || [])
            .filter((t: LotteryTicket) => t.user_id === user.id)
            .map((t: LotteryTicket) => t.ticket_number);
          setMyTickets(userTickets);
        }
      }
    } catch (error) {
      console.error('Error loading lottery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChat = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_lottery_chat'
        })
      });

      if (!response.ok) {
        console.error('Failed to load chat:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const checkDraw = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'check_lottery_draw'
        })
      });

      if (!response.ok) {
        console.error('Failed to check lottery draw:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success && data.processed_rounds > 0) {
        loadLottery();
        if (user) {
          loadNotifications();
        }
        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
      }
    } catch (error) {
      console.error('Error checking lottery draw:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'get_lottery_notifications'
        })
      });

      if (!response.ok) {
        console.error('Failed to load notifications:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success) {
        const unreadNotifs = data.notifications.filter((n: LotteryNotification) => !n.is_read);
        setNotifications(unreadNotifs);
        
        unreadNotifs.forEach((notif: LotteryNotification) => {
          toast({
            title: 'Результат лотереи',
            description: notif.message,
            duration: 10000
          });
        });

        if (unreadNotifs.length > 0) {
          await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': user.id.toString()
            },
            body: JSON.stringify({
              action: 'mark_notifications_read'
            })
          });
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_lottery_history'
        })
      });

      if (!response.ok) {
        console.error('Failed to load history:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const sendMessage = async () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    const trimmedMessage = chatMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    if (trimmedMessage.length > 500) {
      toast({
        title: 'Ошибка',
        description: 'Сообщение слишком длинное (макс. 500 символов)',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingMessage(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'send_lottery_chat',
          message: trimmedMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setChatMessage('');
        loadChat();
      } else {
        toast({
          title: 'Ошибка',
          description: data.message || 'Не удалось отправить сообщение',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const buyTicket = async () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    if (user.balance < TICKET_PRICE) {
      toast({
        title: 'Недостаточно средств',
        description: `Цена билета: ${TICKET_PRICE} USDT`,
        variant: 'destructive'
      });
      return;
    }

    if (tickets.length >= MAX_TICKETS) {
      toast({
        title: 'Лотерея заполнена',
        description: 'Все билеты проданы',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'buy_lottery_ticket',
          amount: TICKET_PRICE
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Билет куплен!',
          description: `Ваш номер: ${data.ticket_number}`
        });
        loadLottery();
        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
      } else {
        toast({
          title: 'Ошибка',
          description: data.message || 'Не удалось купить билет',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">🎫 Лотерея</h1>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  const availableTickets = MAX_TICKETS - tickets.length;
  const prizePool = tickets.length * TICKET_PRICE;
  const isDrawing = currentRound?.status === 'drawing';
  const isCompleted = currentRound?.status === 'completed';

  const ticketsByUser = tickets.reduce((acc, ticket) => {
    acc[ticket.username] = (acc[ticket.username] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">🎫 Лотерея</h1>
          <p className="text-muted-foreground">
            10 билетов по 50 USDT. Победитель получает 400 USDT
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) loadHistory();
          }}
          variant="outline"
          className="gap-2"
        >
          <Icon name="History" size={18} />
          {showHistory ? 'Скрыть историю' : 'История победителей'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-600/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-600/30 flex items-center justify-center">
              <Icon name="Ticket" size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Билетов продано</p>
              <p className="text-2xl font-bold">{tickets.length} / {MAX_TICKETS}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-600/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-600/30 flex items-center justify-center">
              <Icon name="DollarSign" size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Призовой фонд</p>
              <p className="text-2xl font-bold">{prizePool} USDT</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-600/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center">
              <Icon name="Timer" size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {isDrawing ? 'До розыгрыша' : isCompleted ? 'Статус' : 'Билетов осталось'}
              </p>
              <p className="text-2xl font-bold">
                {isDrawing ? timeLeft : isCompleted ? 'Завершено' : availableTickets}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {isCompleted && currentRound?.winner_username && (
        <Card className="p-6 bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border-yellow-600/30">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-yellow-600/30 flex items-center justify-center">
                <Icon name="Trophy" size={40} className="text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold">🎉 Победитель определен!</h3>
            <p className="text-lg">
              <strong className="text-yellow-400">{currentRound.winner_username}</strong> выиграл{' '}
              <strong className="text-green-400">{PRIZE_AMOUNT} USDT</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Выигрышный билет: #{currentRound.winner_ticket_number}
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 bg-gradient-to-b from-indigo-950/40 via-indigo-900/30 to-indigo-950/40 border-indigo-800/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-800/5 via-transparent to-transparent"></div>
          
          <div className="relative space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-indigo-600/20 rounded-2xl">
                <Icon name="Ticket" size={48} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold">Купить билет</h3>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                <span className="text-yellow-400">{TICKET_PRICE}</span>
                <span className="text-muted-foreground">USDT</span>
              </div>
            </div>

            {myTickets.length > 0 && (
              <Card className="p-4 bg-indigo-800/20 border-indigo-800/30">
                <p className="text-center mb-3 font-semibold">Ваши билеты ({myTickets.length}):</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {myTickets.map((num) => (
                    <div
                      key={num}
                      className="w-12 h-12 rounded-lg bg-indigo-600/30 border-2 border-indigo-600/50 flex items-center justify-center font-bold text-lg"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Button
              type="button"
              onClick={buyTicket}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-lg h-14"
              disabled={!user || isProcessing || availableTickets === 0 || isDrawing || isCompleted}
            >
              <Icon name="Ticket" size={20} className="mr-2" />
              {!user ? 'Войдите для покупки' : 
               isDrawing ? 'Идет розыгрыш' :
               isCompleted ? 'Лотерея завершена' :
               availableTickets === 0 ? 'Все билеты проданы' : 
               `Купить билет (${TICKET_PRICE} USDT)`}
            </Button>

            {isDrawing && (
              <Card className="p-4 bg-orange-800/20 border-orange-800/30">
                <div className="flex items-center gap-3">
                  <Icon name="Clock" size={24} className="text-orange-400 animate-pulse" />
                  <div>
                    <p className="font-semibold">Розыгрыш начнется через:</p>
                    <p className="text-2xl font-bold text-orange-400">{timeLeft}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-card/50 flex flex-col">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="MessageSquare" size={20} className="text-blue-400" />
            Чат участников
          </h3>
          
          <div className="flex-1 overflow-y-auto max-h-[400px] mb-4 space-y-3">
            {chatMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Нет сообщений. Будьте первым!
              </p>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.user_id === user?.id
                      ? 'bg-indigo-600/20 border border-indigo-600/30 ml-8'
                      : 'bg-card/80 border border-border/50 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{msg.username}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSendingMessage && sendMessage()}
              placeholder={user ? 'Введите сообщение...' : 'Войдите для отправки'}
              disabled={!user || isSendingMessage}
              maxLength={500}
            />
            <Button
              type="button"
              onClick={sendMessage}
              disabled={!user || isSendingMessage || !chatMessage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="Users" size={20} className="text-indigo-400" />
          Участники ({tickets.length}/{MAX_TICKETS})
        </h3>
        
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
                    <p className="text-xs text-muted-foreground">{count * TICKET_PRICE} USDT</p>
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
                      <p className="text-lg font-bold text-green-400">{PRIZE_AMOUNT} USDT</p>
                      <p className="text-xs text-muted-foreground">{round.total_tickets} участников</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-6 bg-card/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="Info" size={20} className="text-indigo-400" />
          Правила лотереи
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• <strong>Билетов:</strong> всего 10 мест в каждом розыгрыше</p>
          <p>• <strong>Цена билета:</strong> {TICKET_PRICE} USDT</p>
          <p>• <strong>Приз:</strong> фиксированная сумма {PRIZE_AMOUNT} USDT победителю</p>
          <p>• <strong>Покупка:</strong> один игрок может купить неограниченное количество билетов</p>
          <p>• <strong>Розыгрыш:</strong> через {DRAW_DELAY_MINUTES} минуту после продажи всех билетов</p>
          <p>• <strong>Победитель:</strong> выбирается случайно из всех купленных билетов</p>
          <p>• <strong>Выплата:</strong> моментально на баланс победителя</p>
          <p>• <strong>Уведомления:</strong> все участники получат результаты розыгрыша</p>
          <p>• <strong>Чат:</strong> общайтесь с другими участниками во время ожидания розыгрыша</p>
        </div>
      </Card>
    </div>
  );
};

export default LotteryGame;