import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface RouletteGameProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

type BetType = 'red' | 'black' | 'green' | 'even' | 'odd' | 'low' | 'high' | number;

interface Bet {
  type: BetType;
  amount: number;
}

const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
  if (num === 0) return 'green';
  if (redNumbers.includes(num)) return 'red';
  return 'black';
};

const RouletteGame = ({ user, onShowAuthDialog, onRefreshUserBalance }: RouletteGameProps) => {
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [betAmount, setBetAmount] = useState('10');
  const [selectedBetType, setSelectedBetType] = useState<BetType | null>(null);
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'finished'>('betting');
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotation, setRotation] = useState(0);

  const addBet = () => {
    if (!selectedBetType) {
      toast({
        title: 'Ошибка',
        description: 'Выберите тип ставки',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive'
      });
      return;
    }

    const totalBets = bets.reduce((sum, bet) => sum + bet.amount, 0) + amount;
    if (user && totalBets > user.balance) {
      toast({
        title: 'Недостаточно средств',
        description: 'Пополните баланс',
        variant: 'destructive'
      });
      return;
    }

    setBets([...bets, { type: selectedBetType, amount }]);
    setSelectedBetType(null);
    toast({
      title: 'Ставка добавлена',
      description: `${getBetLabel(selectedBetType)}: ${amount} USDT`
    });
  };

  const removeBet = (index: number) => {
    setBets(bets.filter((_, i) => i !== index));
  };

  const getBetLabel = (betType: BetType): string => {
    if (typeof betType === 'number') return `Число ${betType}`;
    const labels: Record<string, string> = {
      red: 'Красное',
      black: 'Черное',
      green: 'Зеро (0)',
      even: 'Четное',
      odd: 'Нечетное',
      low: '1-18',
      high: '19-36'
    };
    return labels[betType] || betType;
  };

  const spin = async () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    if (bets.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Сделайте хотя бы одну ставку',
        variant: 'destructive'
      });
      return;
    }

    const totalBets = bets.reduce((sum, bet) => sum + bet.amount, 0);

    setIsProcessing(true);
    setGameState('spinning');

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'place_bet',
          amount: totalBets,
          game_type: 'roulette'
        })
      });

      const data = await response.json();
      if (!data.success) {
        toast({
          title: 'Ошибка',
          description: data.message || 'Не удалось сделать ставку',
          variant: 'destructive'
        });
        setIsProcessing(false);
        setGameState('betting');
        return;
      }

      const number = Math.floor(Math.random() * 37);
      const spins = 5 + Math.random() * 3;
      const targetRotation = rotation + (360 * spins) + (number * (360 / 37));
      
      setRotation(targetRotation);
      setWinningNumber(number);

      setTimeout(() => {
        finishGame(number, totalBets);
      }, 3000);

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

  const checkBetWin = (bet: Bet, number: number): { won: boolean; multiplier: number } => {
    if (typeof bet.type === 'number') {
      return { won: bet.type === number, multiplier: 36 };
    }

    const color = getNumberColor(number);
    
    switch (bet.type) {
      case 'red':
        return { won: color === 'red', multiplier: 2 };
      case 'black':
        return { won: color === 'black', multiplier: 2 };
      case 'green':
        return { won: number === 0, multiplier: 36 };
      case 'even':
        return { won: number !== 0 && number % 2 === 0, multiplier: 2 };
      case 'odd':
        return { won: number % 2 === 1, multiplier: 2 };
      case 'low':
        return { won: number >= 1 && number <= 18, multiplier: 2 };
      case 'high':
        return { won: number >= 19 && number <= 36, multiplier: 2 };
      default:
        return { won: false, multiplier: 0 };
    }
  };

  const finishGame = async (number: number, totalBet: number) => {
    let totalWin = 0;
    const results: string[] = [];

    bets.forEach(bet => {
      const { won, multiplier } = checkBetWin(bet, number);
      if (won) {
        const winAmount = bet.amount * multiplier;
        totalWin += winAmount;
        results.push(`${getBetLabel(bet.type)}: +${winAmount.toFixed(2)} USDT`);
      }
    });

    try {
      await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user!.id.toString()
        },
        body: JSON.stringify({
          action: 'complete_game',
          won: totalWin > 0,
          amount: totalWin,
          game_type: 'roulette'
        })
      });

      const color = getNumberColor(number);
      const colorText = color === 'red' ? '🔴 Красное' : color === 'black' ? '⚫ Черное' : '🟢 Зеро';
      
      if (totalWin > 0) {
        setResult(`Выпало ${number} ${colorText}! Выигрыш: ${totalWin.toFixed(2)} USDT\n${results.join(', ')}`);
      } else {
        setResult(`Выпало ${number} ${colorText}. Вы проиграли ${totalBet.toFixed(2)} USDT`);
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
    setBets([]);
    setWinningNumber(null);
    setResult('');
    setGameState('betting');
    setSelectedBetType(null);
  };

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Рулетка</h1>
        <p className="text-muted-foreground">
          Европейская рулетка с числами от 0 до 36
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-b from-green-950/40 via-green-900/30 to-green-950/40 border-green-800/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-800/5 via-transparent to-transparent"></div>
        
        <div className="relative space-y-8">
          <div className="flex justify-center py-4">
            <div className="relative w-48 h-48">
              <div 
                className="absolute inset-0 rounded-full border-8 border-amber-600/80 bg-gradient-to-br from-amber-900/40 to-amber-950/60 shadow-2xl"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: gameState === 'spinning' ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                }}
              >
                <div className="absolute inset-6 rounded-full border-4 border-amber-700/60 bg-gradient-to-br from-green-900 to-green-950">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-amber-500 rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-6 border-r-6 border-t-8 border-l-transparent border-r-transparent border-t-yellow-500 z-10"></div>
              
              {winningNumber !== null && gameState !== 'betting' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${
                    getNumberColor(winningNumber) === 'red' ? 'bg-red-600' :
                    getNumberColor(winningNumber) === 'black' ? 'bg-black' :
                    'bg-green-600'
                  } text-white shadow-2xl`}>
                    {winningNumber}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-900/40 p-6 rounded-lg border-2 border-amber-700/30">
            <div className="flex gap-2">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSelectedBetType('green')}
                  className={`w-12 h-36 bg-green-600 hover:bg-green-700 text-white font-bold rounded flex items-center justify-center text-2xl transition-all ${
                    selectedBetType === 'green' ? 'ring-4 ring-yellow-400' : ''
                  }`}
                >
                  0
                </button>
              </div>

              <div className="grid grid-cols-12 gap-[2px]">
                {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedBetType(num)}
                    className={`w-12 h-12 ${
                      getNumberColor(num) === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-900'
                    } text-white font-bold rounded flex items-center justify-center transition-all ${
                      selectedBetType === num ? 'ring-4 ring-yellow-400' : ''
                    }`}
                  >
                    {num}
                  </button>
                ))}
                {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedBetType(num)}
                    className={`w-12 h-12 ${
                      getNumberColor(num) === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-900'
                    } text-white font-bold rounded flex items-center justify-center transition-all ${
                      selectedBetType === num ? 'ring-4 ring-yellow-400' : ''
                    }`}
                  >
                    {num}
                  </button>
                ))}
                {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedBetType(num)}
                    className={`w-12 h-12 ${
                      getNumberColor(num) === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-900'
                    } text-white font-bold rounded flex items-center justify-center transition-all ${
                      selectedBetType === num ? 'ring-4 ring-yellow-400' : ''
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 mt-4">
              <button
                onClick={() => setSelectedBetType('low')}
                className={`col-span-2 py-3 bg-amber-800/40 hover:bg-amber-800/60 border-2 border-amber-600/50 text-white font-bold rounded transition-all ${
                  selectedBetType === 'low' ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                1-18
              </button>
              <button
                onClick={() => setSelectedBetType('even')}
                className={`py-3 bg-amber-800/40 hover:bg-amber-800/60 border-2 border-amber-600/50 text-white font-bold rounded transition-all ${
                  selectedBetType === 'even' ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                ЧЕТН
              </button>
              <button
                onClick={() => setSelectedBetType('odd')}
                className={`py-3 bg-amber-800/40 hover:bg-amber-800/60 border-2 border-amber-600/50 text-white font-bold rounded transition-all ${
                  selectedBetType === 'odd' ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                НЕЧТ
              </button>
              <button
                onClick={() => setSelectedBetType('high')}
                className={`col-span-2 py-3 bg-amber-800/40 hover:bg-amber-800/60 border-2 border-amber-600/50 text-white font-bold rounded transition-all ${
                  selectedBetType === 'high' ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                19-36
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setSelectedBetType('red')}
                className={`py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-lg transition-all ${
                  selectedBetType === 'red' ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                🔴 КРАСНОЕ
              </button>
              <button
                onClick={() => setSelectedBetType('black')}
                className={`py-4 bg-black hover:bg-gray-900 text-white font-bold rounded text-lg transition-all ${
                  selectedBetType === 'black' ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                ⚫ ЧЕРНОЕ
              </button>
            </div>
          </div>

          {result && (
            <Card className={`p-4 text-center ${
              result.includes('Выигрыш') ? 'bg-green-800/20 border-green-800/30' : 
              'bg-red-800/20 border-red-800/30'
            }`}>
              <p className="text-lg font-semibold whitespace-pre-line">{result}</p>
            </Card>
          )}

          {gameState === 'betting' && (
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

              <Button
                onClick={spin}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                disabled={!user || bets.length === 0 || isProcessing}
              >
                <Icon name="Play" size={18} className="mr-2" />
                {user ? 'Крутить рулетку' : 'Войдите для игры'}
              </Button>
            </div>
          )}

          {gameState === 'finished' && (
            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
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
          <Icon name="Info" size={20} className="text-red-400" />
          Правила игры
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• <strong>Числа:</strong> от 0 до 36 (0 - зеленое, остальные красные или черные)</p>
          <p>• <strong>Ставки:</strong> можете делать несколько ставок одновременно</p>
          <p>• <strong>Выплаты:</strong> число (36x), цвет/четность/диапазон (2x)</p>
          <p>• <strong>Красные:</strong> 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36</p>
          <p>• <strong>Черные:</strong> 2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35</p>
        </div>
      </Card>
    </div>
  );
};

export default RouletteGame;