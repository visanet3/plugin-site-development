import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { triggerUserSync } from '@/utils/userSync';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface DiceGameProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

type BetType = 1 | 2 | 3 | 4 | 5 | 6 | 'even' | 'odd' | 'low' | 'high';

const DiceGame = ({ user, onShowAuthDialog, onRefreshUserBalance }: DiceGameProps) => {
  const { toast } = useToast();
  const [bet, setBet] = useState('10');
  const [betType, setBetType] = useState<BetType | null>(null);
  const [gameState, setGameState] = useState<'betting' | 'rolling' | 'finished'>('betting');
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const rollDice = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!user) {
      onShowAuthDialog();
      return;
    }

    if (!betType) {
      toast({
        title: 'Ошибка',
        description: 'Выберите тип ставки',
        variant: 'destructive'
      });
      return;
    }

    const betAmount = parseFloat(bet);
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную ставку',
        variant: 'destructive'
      });
      return;
    }

    if (betAmount > user.balance) {
      toast({
        title: 'Недостаточно средств',
        description: 'Пополните баланс',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setGameState('rolling');

    try {
      const betResponse = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'place_bet',
          amount: betAmount,
          game_type: 'Dice'
        })
      });

      const betData = await betResponse.json();
      if (!betData.success) {
        toast({
          title: 'Ошибка',
          description: betData.message || 'Не удалось сделать ставку',
          variant: 'destructive'
        });
        setIsProcessing(false);
        setGameState('betting');
        return;
      }

      triggerUserSync();
      onRefreshUserBalance?.();

      const result = Math.floor(Math.random() * 6) + 1;
      
      const spins = 3 + Math.random() * 2;
      setRotation(rotation + (360 * spins));
      
      setTimeout(() => {
        setDiceResult(result);
        checkWin(result, betAmount);
      }, 1500);

    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
      setIsProcessing(false);
      setGameState('betting');
    }
  };

  const checkWin = async (dice: number, betAmount: number) => {
    let won = false;
    let multiplier = 0;

    if (typeof betType === 'number') {
      won = betType === dice;
      multiplier = 6;
    } else {
      switch (betType) {
        case 'even':
          won = dice % 2 === 0;
          multiplier = 2;
          break;
        case 'odd':
          won = dice % 2 === 1;
          multiplier = 2;
          break;
        case 'low':
          won = dice <= 3;
          multiplier = 2;
          break;
        case 'high':
          won = dice >= 4;
          multiplier = 2;
          break;
      }
    }

    const winAmount = won ? betAmount * multiplier : 0;

    try {
      if (won) {
        await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user!.id.toString()
          },
          body: JSON.stringify({
            action: 'complete_game',
            won: true,
            amount: winAmount,
            bet_amount: betAmount,
            game_type: 'Dice'
          })
        });
        setResult(`🎲 Выпало ${dice}! Вы выиграли ${winAmount.toFixed(2)} USDT`);
        toast({
          title: '🎉 Победа!',
          description: `+${winAmount.toFixed(2)} USDT`,
          variant: 'default'
        });
      } else {
        await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user!.id.toString()
          },
          body: JSON.stringify({
            action: 'complete_game',
            won: false,
            amount: 0,
            bet_amount: betAmount,
            game_type: 'Dice'
          })
        });
        setResult(`🎲 Выпало ${dice}. Вы проиграли ${betAmount.toFixed(2)} USDT`);
        toast({
          title: '😔 Проигрыш',
          description: `-${betAmount.toFixed(2)} USDT`,
          variant: 'destructive'
        });
      }
      
      setGameState('finished');
      
      await clearGameSession();
      
      triggerUserSync();
      if (onRefreshUserBalance) {
        onRefreshUserBalance();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при завершении игры',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearGameSession = async () => {
    if (!user) return;
    try {
      await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'clear_game_session',
          game_type: 'dice'
        })
      });
    } catch (error) {
      console.error('Ошибка очистки сессии:', error);
    }
  };

  const resetGame = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    await clearGameSession();
    setDiceResult(null);
    setResult('');
    setGameState('betting');
    setBetType(null);
    setSessionLoaded(false);
  };

  const getBetLabel = (type: BetType): string => {
    if (typeof type === 'number') return `Число ${type}`;
    const labels: Record<string, string> = {
      even: 'Четное',
      odd: 'Нечетное',
      low: 'Малое (1-3)',
      high: 'Большое (4-6)'
    };
    return labels[type] || '';
  };

  const getDiceFace = (num: number) => {
    const dots: Record<number, number[][]> = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]]
    };

    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl shadow-2xl grid grid-cols-3 grid-rows-3 gap-1 sm:gap-1.5 p-2 sm:p-2.5">
        {Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const hasDot = dots[num].some(([r, c]) => r === row && c === col);
          return (
            <div
              key={i}
              className={`rounded-full ${hasDot ? 'bg-primary' : ''}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">Кости</h2>
        <p className="text-sm text-muted-foreground">
          Выберите число или тип ставки и бросьте кость
        </p>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          {/* Dice Display */}
          <div className="flex justify-center items-center py-6 sm:py-8">
            {diceResult ? (
              <div
                className="transition-transform duration-1500 ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`
                }}
              >
                {getDiceFace(diceResult)}
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-xl flex items-center justify-center border-2 border-dashed border-primary/30">
                <span className="text-3xl sm:text-4xl">?</span>
              </div>
            )}
          </div>

          {/* Betting Section */}
          {gameState !== 'finished' && (
            <>
              {/* Bet Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Тип ставки</label>
                
                {/* Number Bets */}
                <div className="grid grid-cols-6 gap-2">
                  {([1, 2, 3, 4, 5, 6] as const).map((num) => (
                    <Button
                      key={num}
                      variant={betType === num ? 'default' : 'outline'}
                      className="h-11 text-sm sm:text-base"
                      onClick={() => setBetType(num)}
                      disabled={gameState !== 'betting'}
                    >
                      {num}
                    </Button>
                  ))}
                </div>

                {/* Group Bets */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { type: 'even' as const, label: 'Четное', multiplier: '2x' },
                    { type: 'odd' as const, label: 'Нечетное', multiplier: '2x' }
                  ]).map((option) => (
                    <Button
                      key={option.type}
                      variant={betType === option.type ? 'default' : 'outline'}
                      className="h-11 flex flex-col items-center justify-center gap-0.5"
                      onClick={() => setBetType(option.type)}
                      disabled={gameState !== 'betting'}
                    >
                      <span className="text-xs sm:text-sm">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.multiplier}</span>
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {([
                    { type: 'low' as const, label: 'Малое', desc: '1-3', multiplier: '2x' },
                    { type: 'high' as const, label: 'Большое', desc: '4-6', multiplier: '2x' }
                  ]).map((option) => (
                    <Button
                      key={option.type}
                      variant={betType === option.type ? 'default' : 'outline'}
                      className="h-11 flex flex-col items-center justify-center gap-0.5"
                      onClick={() => setBetType(option.type)}
                      disabled={gameState !== 'betting'}
                    >
                      <span className="text-xs sm:text-sm">{option.label} {option.desc}</span>
                      <span className="text-xs text-muted-foreground">{option.multiplier}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bet Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Ставка</label>
                  {user && (
                    <span className="text-xs text-muted-foreground">
                      Баланс: {Number(user.balance || 0).toFixed(2)} USDT
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(e.target.value)}
                    className="h-10 pr-14"
                    disabled={gameState !== 'betting'}
                    min="1"
                    step="1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    USDT
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setBet(amount.toString())}
                      disabled={gameState !== 'betting'}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selected Bet Display */}
              {betType && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Выбрано:</span>
                    <span className="font-medium">{getBetLabel(betType)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Множитель:</span>
                    <span className="font-medium text-primary">
                      {typeof betType === 'number' ? '6x' : '2x'}
                    </span>
                  </div>
                </div>
              )}

              {/* Roll Button */}
              <Button
                onClick={rollDice}
                className="w-full h-12 md:h-14 text-base font-semibold"
                disabled={!betType || gameState !== 'betting' || isProcessing}
              >
                {isProcessing ? (
                  <Icon name="loader-2" className="w-5 h-5 animate-spin" />
                ) : (
                  'Бросить кость'
                )}
              </Button>
            </>
          )}

          {/* Result Display */}
          {gameState === 'finished' && result && (
            <div className="space-y-4">
              <div className={`text-center text-base sm:text-lg font-medium p-4 rounded-lg ${
                result.includes('выиграли') 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {result}
              </div>
              <Button
                onClick={resetGame}
                className="w-full h-12 md:h-14 text-base font-semibold"
              >
                Играть снова
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Rules Card */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-2">Правила игры</h3>
        <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Выберите число (1-6) - выигрыш x6</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Четное/Нечетное - выигрыш x2</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Малое (1-3) / Большое (4-6) - выигрыш x2</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Выберите тип ставки и сумму</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Нажмите "Бросить кость" для начала игры</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default DiceGame;