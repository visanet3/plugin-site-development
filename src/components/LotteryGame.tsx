import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import LotteryStats from './lottery/LotteryStats';
import LotteryTicketPurchase from './lottery/LotteryTicketPurchase';
import LotteryChat from './lottery/LotteryChat';
import LotteryParticipants from './lottery/LotteryParticipants';
import LotteryWinnerCard from './lottery/LotteryWinnerCard';
import LotteryRules from './lottery/LotteryRules';
import { useLotteryTimer } from './lottery/useLotteryTimer';
import {
  LotteryTicket,
  LotteryRound,
  ChatMessage,
  LotteryNotification,
  LotteryHistory,
  loadLottery,
  loadChat,
  checkDraw,
  loadNotifications,
  markNotificationsRead,
  loadHistory,
  sendMessage as sendChatMessage,
  buyTicket as buyLotteryTicket
} from './lottery/LotteryDataLoader';

interface LotteryGameProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<LotteryNotification[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<LotteryHistory[]>([]);
  const [prevChatLength, setPrevChatLength] = useState(0);

  const timeLeft = useLotteryTimer(currentRound);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadLotteryData();
    loadChatData();
    checkDrawStatus();
    if (user) {
      loadNotificationsData();
    }
  }, [user]);

  useEffect(() => {
    setPrevChatLength(chatMessages.length);
  }, [chatMessages]);

  const loadLotteryData = async () => {
    const data = await loadLottery(user);
    if (data) {
      setCurrentRound(data.round);
      setTickets(data.tickets);
      setMyTickets(data.userTickets);
    }
    setIsLoading(false);
  };

  const loadChatData = async () => {
    const messages = await loadChat();
    if (messages) {
      setChatMessages(messages);
    }
  };

  const checkDrawStatus = async () => {
    const result = await checkDraw();
    if (result.processed) {
      loadLotteryData();
      if (user) {
        loadNotificationsData();
      }
      if (onRefreshUserBalance) {
        onRefreshUserBalance();
      }
    }
  };

  const loadNotificationsData = async () => {
    if (!user) return;
    
    const unreadNotifs = await loadNotifications(user);
    if (unreadNotifs && unreadNotifs.length > 0) {
      setNotifications(unreadNotifs);
      
      unreadNotifs.forEach((notif: LotteryNotification) => {
        toast({
          title: 'Результат лотереи',
          description: notif.message,
          duration: 10000
        });
      });

      await markNotificationsRead(user);
    }
  };

  const loadHistoryData = async () => {
    const historyData = await loadHistory();
    if (historyData) {
      setHistory(historyData);
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

    const data = await sendChatMessage(user, trimmedMessage);
    if (data.success) {
      setChatMessage('');
      loadChatData();
    } else {
      toast({
        title: 'Ошибка',
        description: data.message || 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    }
    setIsSendingMessage(false);
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

    const data = await buyLotteryTicket(user, TICKET_PRICE);
    if (data.success) {
      toast({
        title: 'Билет куплен!',
        description: `Ваш номер: ${data.ticket_number}`
      });
      loadLotteryData();
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
    setIsProcessing(false);
  };

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory) loadHistoryData();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Лотерея</h1>
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  const availableTickets = MAX_TICKETS - tickets.length;
  const prizePool = PRIZE_AMOUNT;
  const isDrawing = currentRound?.status === 'drawing';
  const isCompleted = currentRound?.status === 'completed';

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Лотерея</h1>
          <p className="text-sm text-muted-foreground">
            10 билетов по 50 USDT. Победитель получает 400 USDT
          </p>
        </div>
        <Button
          type="button"
          onClick={handleToggleHistory}
          variant="outline"
          className="gap-2 h-10 text-sm"
        >
          <Icon name="History" size={16} />
          <span className="hidden sm:inline">{showHistory ? 'Скрыть историю' : 'История победителей'}</span>
          <span className="sm:hidden">История</span>
        </Button>
      </div>

      <LotteryStats
        ticketsCount={tickets.length}
        maxTickets={MAX_TICKETS}
        prizePool={prizePool}
        timeLeft={timeLeft}
        isDrawing={isDrawing}
        isCompleted={isCompleted}
        availableTickets={availableTickets}
      />

      {currentRound && (
        <LotteryWinnerCard currentRound={currentRound} prizeAmount={PRIZE_AMOUNT} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LotteryTicketPurchase
          user={user}
          myTickets={myTickets}
          ticketPrice={TICKET_PRICE}
          isProcessing={isProcessing}
          availableTickets={availableTickets}
          isDrawing={isDrawing}
          isCompleted={isCompleted}
          timeLeft={timeLeft}
          onBuyTicket={buyTicket}
        />

        <LotteryChat
          user={user}
          chatMessages={chatMessages}
          chatMessage={chatMessage}
          isSendingMessage={isSendingMessage}
          chatEndRef={chatEndRef}
          onChatMessageChange={setChatMessage}
          onSendMessage={sendMessage}
          onKeyDown={(e) => e.key === 'Enter' && !isSendingMessage && sendMessage()}
        />
      </div>

      <LotteryParticipants
        tickets={tickets}
        myTickets={myTickets}
        maxTickets={MAX_TICKETS}
      />

      {showHistory && (
        <LotteryRules history={history} />
      )}
    </div>
  );
};

export default LotteryGame;
