import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface SlotsGameProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣'];
const SYMBOL_VALUES = {
  '🍒': 2,
  '🍋': 3,
  '🍊': 4,
  '🍇': 5,
  '🔔': 10,
  '💎': 20,
  '7️⃣': 50
};

const SlotsGame = ({ user, onShowAuthDialog, onRefreshUserBalance }: SlotsGameProps) => {
  const { toast } = useToast();
  const [bet, setBet] = useState('10');
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'finished'>('betting');
  const [reels, setReels] = useState<string[]>(['🍒', '🍒', '🍒']);
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const getRandomSymbol = (): string => {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  };

  const generateWinningCombination = (): string[] => {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    return [symbol, symbol, symbol];
  };

  const generateLosingCombination = (): string[] => {
    const reels: string[] = [];
    reels.push(getRandomSymbol());
    
    let secondSymbol = getRandomSymbol();
    while (secondSymbol === reels[0]) {
      secondSymbol = getRandomSymbol();
    }
    reels.push(secondSymbol);
    
    let thirdSymbol = getRandomSymbol();
    while (thirdSymbol === reels[0] && thirdSymbol === reels[1]) {
      thirdSymbol = getRandomSymbol();
    }
    reels.push(thirdSymbol);
    
    return reels;
  };

  const spin = async () => {
    if (!user) {
      onShowAuthDialog();
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
    setGameState('spinning');
    setIsSpinning(true);

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
          game_type: 'Slots'
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
        setIsSpinning(false);
        return;
      }

      onRefreshUserBalance?.();

      const spinInterval = setInterval(() => {
        setReels([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
      }, 100);

      setTimeout(() => {
        clearInterval(spinInterval);
        
        const shouldWin = Math.random() < 0.4;
        const finalReels = shouldWin ? generateWinningCombination() : generateLosingCombination();
        
        setReels(finalReels);
        setIsSpinning(false);
        
        checkWin(finalReels, betAmount);
      }, 2000);

    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
      setIsProcessing(false);
      setGameState('betting');
      setIsSpinning(false);
    }
  };

  const checkWin = async (finalReels: string[], betAmount: number) => {
    const [first, second, third] = finalReels;
    let won = false;
    let multiplier = 0;

    if (first === second && second === third) {
      won = true;
      multiplier = SYMBOL_VALUES[first as keyof typeof SYMBOL_VALUES] || 2;
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
            game_type: 'Slots'
          })
        });

        setResult(`🎰 ${first} ${second} ${third} - Выигрыш ${winAmount.toFixed(2)} USDT! (${multiplier}x)`);
        toast({
          title: '🎉 Победа!',
          description: `+${winAmount.toFixed(2)} USDT (${multiplier}x)`,
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
            game_type: 'Slots'
          })
        });

        setResult(`🎰 ${first} ${second} ${third} - Проигрыш ${betAmount.toFixed(2)} USDT`);
        toast({
          title: '😔 Проигрыш',
          description: `-${betAmount.toFixed(2)} USDT`,
          variant: 'destructive'
        });
      }

      setGameState('finished');

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

  const resetGame = () => {
    setGameState('betting');
    setResult('');
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">🎰 Слоты</h1>
        <p className="text-sm text-muted-foreground">
          Классический игровой автомат. Соберите 3 одинаковых символа!
        </p>
      </div>

      <Card className="p-4 md:p-6 bg-gradient-to-b from-yellow-950/40 via-yellow-900/30 to-yellow-950/40 border-yellow-800/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-800/5 via-transparent to-transparent"></div>
        
        <div className="relative space-y-4">
          <div className="bg-gradient-to-b from-yellow-900/40 to-yellow-950/40 rounded-2xl p-4 md:p-6 border-2 md:border-4 border-yellow-700/50 shadow-2xl">
            <div className="flex justify-center gap-2 md:gap-4 mb-4">
              {reels.map((symbol, index) => (
                <div
                  key={index}
                  className={`w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl flex items-center justify-center text-4xl md:text-6xl shadow-2xl ${
                    isSpinning ? 'animate-spin' : 'animate-bounce'
                  }`}
                >
                  {symbol}
                </div>
              ))}
            </div>

            {result && (
              <Card className={`p-3 text-center ${
                result.includes('Выигрыш') ? 'bg-green-800/20 border-green-800/30' : 
                'bg-red-800/20 border-red-800/30'
              }`}>
                <p className="text-sm md:text-base font-semibold">{result}</p>
              </Card>
            )}
          </div>

          {gameState === 'betting' && (
            <div className="space-y-3">
              <div className="p-3 md:p-4 bg-yellow-800/20 border border-yellow-700/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Баланс:</span>
                  <span className="font-bold">{user ? `${Number(user.balance || 0).toFixed(2)} USDT` : '0.00 USDT'}</span>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Ставка</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={bet}
                      onChange={(e) => setBet(e.target.value)}
                      min="0.1"
                      step="0.1"
                      placeholder="10"
                      disabled={!user}
                      className="pr-12 h-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USDT</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={spin}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-700 hover:to-yellow-900 text-base md:text-lg h-12 md:h-14 font-bold"
                disabled={!user || isProcessing}
              >
                <Icon name="Play" size={20} className="mr-2" />
                {user ? 'Крутить' : 'Войдите для игры'}
              </Button>
            </div>
          )}

          {gameState === 'finished' && (
            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-700 hover:to-yellow-900 h-11"
              disabled={isProcessing}
            >
              <Icon name="RotateCcw" size={18} className="mr-2" />
              Новая игра
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-card/50">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Icon name="Info" size={18} className="text-yellow-400" />
          Таблица выплат
        </h3>
        <div className="space-y-2 text-xs md:text-sm">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl">7️⃣7️⃣7️⃣</span>
              <span className="text-yellow-400 font-bold">50x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl">💎💎💎</span>
              <span className="text-cyan-400 font-bold">20x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl">🔔🔔🔔</span>
              <span className="text-blue-400 font-bold">10x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl">🍇🍇🍇</span>
              <span className="text-purple-400 font-bold">5x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl">🍊🍊🍊</span>
              <span className="text-orange-400 font-bold">4x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl">🍋🍋🍋</span>
              <span className="text-yellow-400 font-bold">3x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl">🍒🍒🍒</span>
              <span className="text-red-400 font-bold">2x</span>
            </div>
          </div>
          <p className="text-muted-foreground pt-2">
            • 3 одинаковых символа для выигрыша • Минимум: 0.1 USDT
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SlotsGame;