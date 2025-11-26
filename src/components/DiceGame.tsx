import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

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

    const userBalance = Number(user?.balance || 0);
    const betPercentage = (betAmount / userBalance) * 100;
    const isHighBet = betPercentage > 40;

    if (isHighBet && won && Math.random() < 0.3) {
      won = false;
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
        setResult(`🎲 Выпало ${dice}. Вы проиграли ${betAmount.toFixed(2)} USDT`);
        toast({
          title: '😔 Проигрыш',
          description: `-${betAmount.toFixed(2)} USDT`,
          variant: 'destructive'
        });
      }
      
      setGameState('finished');
      
      await clearGameSession();
      
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
              className={`rounded-full ${hasDot ? 'bg-gray-900' : 'bg-transparent'}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dice</h1>
        <p className="text-muted-foreground">
          Бросайте кубик и угадывайте результат. Выигрыш до 6x
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-b from-orange-950/40 via-orange-900/30 to-orange-950/40 border-orange-800/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-800/5 via-transparent to-transparent"></div>
        
        <div className="relative space-y-8">
          <div className="flex justify-center py-8">
            <div
              className="transform transition-transform duration-1000"
              style={{
                transform: gameState === 'rolling' ? `rotate(${rotation}deg)` : 'rotate(0deg)',
                transition: gameState === 'rolling' ? 'transform 1.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'transform 0.3s ease-out'
              }}
            >
              {diceResult && gameState !== 'betting' ? getDiceFace(diceResult) : getDiceFace(1)}
            </div>
          </div>

          {result && (
            <Card className={`p-4 text-center ${
              result.includes('выиграли') ? 'bg-green-800/20 border-green-800/30' : 
              'bg-red-800/20 border-red-800/30'
            }`}>
              <p className="text-lg font-semibold">{result}</p>
            </Card>
          )}

          {gameState === 'betting' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 mb-4 p-4 bg-orange-800/20 border border-orange-700/30 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">Ставка (USDT)</label>
                  <Input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(e.target.value)}
                    min="0.1"
                    step="0.1"
                    placeholder="Введите ставку"
                    disabled={!user}
                    className="w-40"
                  />
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Ваш баланс</div>
                  <div className="text-2xl font-bold text-primary">
                    {user ? `${Number(user.balance || 0).toFixed(2)} USDT` : '0.00 USDT'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-3">Ставка на конкретное число (6x)</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      onClick={() => setBetType(num as BetType)}
                      variant={betType === num ? 'default' : 'outline'}
                      className={`h-12 sm:h-14 text-lg sm:text-xl font-bold ${
                        betType === num ? 'bg-orange-600 hover:bg-orange-700' : ''
                      }`}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Ставка на диапазон (2x)</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => setBetType('even')}
                    variant={betType === 'even' ? 'default' : 'outline'}
                    className={betType === 'even' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Четное (2x)
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setBetType('odd')}
                    variant={betType === 'odd' ? 'default' : 'outline'}
                    className={betType === 'odd' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    Нечетное (2x)
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setBetType('low')}
                    variant={betType === 'low' ? 'default' : 'outline'}
                    className={betType === 'low' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    1-3 (2x)
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setBetType('high')}
                    variant={betType === 'high' ? 'default' : 'outline'}
                    className={betType === 'high' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    4-6 (2x)
                  </Button>
                </div>
              </div>

              {betType && (
                <Card className="p-3 bg-orange-800/20 border-orange-800/30">
                  <p className="text-sm text-center">
                    Ваша ставка: <strong>{getBetLabel(betType)}</strong> — {bet} USDT
                  </p>
                </Card>
              )}

              <Button
                type="button"
                onClick={rollDice}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900"
                disabled={!user || !betType || isProcessing}
              >
                <Icon name="Dices" size={18} className="mr-2" />
                {user ? 'Бросить кубик' : 'Войдите для игры'}
              </Button>
            </div>
          )}

          {gameState === 'finished' && (
            <Button
              type="button"
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900"
              disabled={isProcessing}
            >
              <Icon name="RotateCcw" size={18} className="mr-2" />
              Новая игра
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-card/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="Info" size={20} className="text-orange-400" />
          Правила игры
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• <strong>Цель:</strong> угадать результат броска кубика (1-6)</p>
          <p>• <strong>Конкретное число:</strong> выигрыш 6x от ставки</p>
          <p>• <strong>Четное/Нечетное:</strong> выигрыш 2x от ставки</p>
          <p>• <strong>Малое (1-3) / Большое (4-6):</strong> выигрыш 2x от ставки</p>
          <p>• <strong>Минимальная ставка:</strong> 0.1 USDT</p>
        </div>
      </Card>
    </div>
  );
};

export default DiceGame;