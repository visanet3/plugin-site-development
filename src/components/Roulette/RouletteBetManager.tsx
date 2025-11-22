import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

type BetType = 'red' | 'black' | 'green' | 'even' | 'odd' | 'low' | 'high' | number;

interface Bet {
  type: BetType;
  amount: number;
}

interface RouletteBetManagerProps {
  user: User | null;
  betAmount: string;
  setBetAmount: (amount: string) => void;
  selectedBetType: BetType | null;
  bets: Bet[];
  addBet: () => void;
  removeBet: (index: number) => void;
  getBetLabel: (type: BetType) => string;
  totalBetAmount: number;
}

const RouletteBetManager = ({
  user,
  betAmount,
  setBetAmount,
  selectedBetType,
  bets,
  addBet,
  removeBet,
  getBetLabel,
  totalBetAmount
}: RouletteBetManagerProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          min="0.1"
          step="0.1"
          placeholder="Сумма ставки"
          disabled={!user}
          className="flex-1"
        />
        <Button
          onClick={addBet}
          disabled={!user || !selectedBetType}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Icon name="Plus" size={18} className="mr-2" />
          Добавить
        </Button>
      </div>

      {bets.length > 0 && (
        <Card className="p-4 bg-black/20">
          <h4 className="font-semibold mb-3">Ваши ставки:</h4>
          <div className="space-y-2">
            {bets.map((bet, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded">
                <span>{getBetLabel(bet.type)}: {bet.amount} USDT</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeBet(i)}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
            ))}
            <div className="pt-2 border-t border-white/10 font-bold">
              Общая ставка: {totalBetAmount.toFixed(2)} USDT
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RouletteBetManager;
