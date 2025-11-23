import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { LotteryRound } from './LotteryDataLoader';

interface LotteryWinnerCardProps {
  currentRound: LotteryRound;
  prizeAmount: number;
}

const LotteryWinnerCard = ({ currentRound, prizeAmount }: LotteryWinnerCardProps) => {
  if (currentRound.status !== 'completed' || !currentRound.winner_username) {
    return null;
  }

  return (
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
          <strong className="text-green-400">{prizeAmount} USDT</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Выигрышный билет: #{currentRound.winner_ticket_number}
        </p>
      </div>
    </Card>
  );
};

export default LotteryWinnerCard;
