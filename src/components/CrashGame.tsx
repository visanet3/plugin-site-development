import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface CrashGameProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

const CrashGame = ({ user, onShowAuthDialog, onRefreshUserBalance }: CrashGameProps) => {
  const { toast } = useToast();
  const [bet, setBet] = useState('10');
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [gameState, setGameState] = useState<'betting' | 'flying' | 'crashed'>('betting');
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(1.00);
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const generateCrashPoint = (): number => {
    const random = Math.random();
    if (random < 0.5) return 1.0 + Math.random() * 0.5;
    if (random < 0.8) return 1.5 + Math.random() * 1.5;
    if (random < 0.95) return 3.0 + Math.random() * 2.0;
    return 5.0 + Math.random() * 5.0;
  };

  const startGame = async () => {
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
          game_type: 'Crash'
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
        return;
      }

      onRefreshUserBalance?.();

      const crash = generateCrashPoint();
      setCrashPoint(crash);
      setMultiplier(1.00);
      setHasCashedOut(false);
      setGameState('flying');
      setResult('');
      setIsProcessing(false);

      let currentMultiplier = 1.00;
      const autoCashoutValue = parseFloat(autoCashout);

      let localHasCashedOut = false;
      
      intervalRef.current = setInterval(() => {
        currentMultiplier += 0.01;
        setMultiplier(currentMultiplier);

        if (!isNaN(autoCashoutValue) && currentMultiplier >= autoCashoutValue && !localHasCashedOut) {
          localHasCashedOut = true;
          setHasCashedOut(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          cashout(currentMultiplier, betAmount, true);
          return;
        }

        if (currentMultiplier >= crash) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (!localHasCashedOut) {
            handleCrash(betAmount);
          }
        }
      }, 100);

    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  const cashout = async (currentMultiplier: number, betAmount: number, auto: boolean = false) => {
    if (hasCashedOut || gameState !== 'flying') return;

    setHasCashedOut(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const winAmount = betAmount * currentMultiplier;

    try {
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
          game_type: 'Crash'
        })
      });

      setResult(`${auto ? '🤖 Авто-вывод' : '💰 Вывод'} на ${currentMultiplier.toFixed(2)}x! Выигрыш: ${winAmount.toFixed(2)} USDT`);
      setGameState('crashed');
      
      toast({
        title: '🎉 Успешный вывод!',
        description: `+${winAmount.toFixed(2)} USDT (${currentMultiplier.toFixed(2)}x)`,
        variant: 'default'
      });

      onRefreshUserBalance?.();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при выводе',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrash = async (betAmount: number) => {
    setGameState('crashed');

    try {
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
          game_type: 'Crash'
        })
      });

      setResult(`💥 Крах на ${crashPoint.toFixed(2)}x! Вы проиграли ${betAmount.toFixed(2)} USDT`);
      
      toast({
        title: '😔 Крах!',
        description: `-${betAmount.toFixed(2)} USDT на ${crashPoint.toFixed(2)}x`,
        variant: 'destructive'
      });

      onRefreshUserBalance?.();
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
    setMultiplier(1.00);
    setCrashPoint(1.00);
    setResult('');
    setHasCashedOut(false);
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">🚀 Crash</h1>
        <p className="text-sm text-muted-foreground">
          Ракета взлетает и множитель растет. Выведите до краха!
        </p>
      </div>

      <Card className="p-4 md:p-6 bg-gradient-to-b from-blue-950/40 via-blue-900/30 to-blue-950/40 border-blue-800/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-800/5 via-transparent to-transparent"></div>
        
        <div className="relative space-y-4">
          <div className="flex justify-center items-center py-8 md:py-10 relative">
            <div className={`text-5xl md:text-7xl font-bold transition-all duration-300 ${
              gameState === 'flying' ? 'text-green-400 animate-pulse scale-110' : 
              gameState === 'crashed' ? 'text-red-400' : 'text-blue-400'
            }`}>
              {multiplier.toFixed(2)}x
            </div>
            {gameState === 'flying' && (
              <div className="absolute text-4xl md:text-5xl animate-bounce">
                🚀
              </div>
            )}
            {gameState === 'crashed' && !hasCashedOut && (
              <div className="absolute text-4xl md:text-5xl animate-ping">
                💥
              </div>
            )}
          </div>

          {result && (
            <Card className={`p-3 text-center ${
              result.includes('Выигрыш') || result.includes('Вывод') ? 'bg-green-800/20 border-green-800/30' : 
              'bg-red-800/20 border-red-800/30'
            }`}>
              <p className="text-sm md:text-base font-semibold">{result}</p>
            </Card>
          )}

          {gameState === 'betting' && (
            <div className="space-y-3">
              <div className="p-3 md:p-4 bg-blue-800/20 border border-blue-700/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Баланс:</span>
                  <span className="font-bold">{user ? `${Number(user.balance || 0).toFixed(2)} USDT` : '0.00 USDT'}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Авто-вывод</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={autoCashout}
                        onChange={(e) => setAutoCashout(e.target.value)}
                        min="1.01"
                        step="0.1"
                        placeholder="2.00"
                        disabled={!user}
                        className="pr-8 h-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">x</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 h-11"
                disabled={!user || isProcessing}
              >
                <Icon name="Rocket" size={18} className="mr-2" />
                {user ? 'Запустить' : 'Войдите для игры'}
              </Button>
            </div>
          )}

          {gameState === 'flying' && !hasCashedOut && (
            <Button
              onClick={() => {
                setHasCashedOut(true);
                cashout(multiplier, parseFloat(bet), false);
              }}
              className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-base md:text-lg h-12 md:h-14 font-bold"
              disabled={isProcessing || hasCashedOut}
            >
              <Icon name="DollarSign" size={20} className="mr-2" />
              Забрать {(parseFloat(bet) * multiplier).toFixed(2)} USDT
            </Button>
          )}

          {gameState === 'crashed' && (
            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 h-11"
            >
              <Icon name="RotateCcw" size={18} className="mr-2" />
              Новая игра
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-card/50">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Icon name="Info" size={18} className="text-blue-400" />
          Правила игры
        </h3>
        <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
          <p>• <strong>Цель:</strong> вывести до краха ракеты</p>
          <p>• <strong>Множитель:</strong> растет каждые 0.1 сек</p>
          <p>• <strong>Авто-вывод:</strong> выводит при заданном множителе</p>
          <p>• <strong>Минимум:</strong> 0.1 USDT</p>
        </div>
      </Card>
    </div>
  );
};

export default CrashGame;