import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface LotteryTicketPurchaseProps {
  user: User | null;
  myTickets: number[];
  ticketPrice: number;
  isProcessing: boolean;
  availableTickets: number;
  isDrawing: boolean;
  isCompleted: boolean;
  timeLeft: string;
  onBuyTicket: () => void;
}

const LotteryTicketPurchase = ({
  user,
  myTickets,
  ticketPrice,
  isProcessing,
  availableTickets,
  isDrawing,
  isCompleted,
  timeLeft,
  onBuyTicket
}: LotteryTicketPurchaseProps) => {
  return (
    <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-b from-indigo-950/40 via-indigo-900/30 to-indigo-950/40 border-indigo-800/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-800/5 via-transparent to-transparent"></div>
      
      <div className="relative space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-4 p-4 bg-indigo-800/20 border border-indigo-700/30 rounded-lg mb-4">
          <div className="text-center flex-1">
            <div className="inline-block p-3 sm:p-4 bg-indigo-600/20 rounded-2xl mb-2">
              <Icon name="Ticket" size={36} className="text-indigo-400 sm:w-12 sm:h-12" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Купить билет</h3>
            <div className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-bold">
              <span className="text-yellow-400">{ticketPrice}</span>
              <span className="text-muted-foreground">USDT</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Ваш баланс</div>
            <div className="text-2xl font-bold text-primary">
              {user ? `${user.balance.toFixed(2)} USDT` : '0.00 USDT'}
            </div>
          </div>
        </div>

        {myTickets.length > 0 && (
          <Card className="p-4 bg-indigo-800/20 border-indigo-800/30">
            <p className="text-center mb-2 sm:mb-3 text-sm sm:text-base font-semibold">Ваши билеты ({myTickets.length}):</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {myTickets.map((num) => (
                <div
                  key={num}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-600/30 border-2 border-indigo-600/50 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg"
                >
                  {num}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Button
          type="button"
          onClick={onBuyTicket}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-sm sm:text-base md:text-lg h-12 sm:h-14"
          disabled={!user || isProcessing || availableTickets === 0 || isDrawing || isCompleted}
        >
          <Icon name="Ticket" size={18} className="mr-1.5 sm:mr-2 sm:w-5 sm:h-5" />
          {!user ? 'Войдите для покупки' : 
           isDrawing ? 'Идет розыгрыш' :
           isCompleted ? 'Лотерея завершена' :
           availableTickets === 0 ? 'Все билеты проданы' : 
           `Купить билет (${ticketPrice} USDT)`}
        </Button>

        {isDrawing && (
          <Card className="p-3 sm:p-4 bg-orange-800/20 border-orange-800/30">
            <div className="flex items-center gap-2 sm:gap-3">
              <Icon name="Clock" size={20} className="text-orange-400 animate-pulse sm:w-6 sm:h-6" />
              <div>
                <p className="text-sm sm:text-base font-semibold">Розыгрыш начнется через:</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-400">{timeLeft}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
};

export default LotteryTicketPurchase;