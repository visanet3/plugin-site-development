import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { triggerUserSync } from '@/utils/userSync';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface MinesGameProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

type CellState = 'hidden' | 'gem' | 'mine';

const GRID_SIZE = 25;

const MinesGame = ({ user, onShowAuthDialog, onRefreshUserBalance }: MinesGameProps) => {
  const { toast } = useToast();
  const [bet, setBet] = useState('10');
  const [minesCount, setMinesCount] = useState('3');
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [grid, setGrid] = useState<CellState[]>(Array(GRID_SIZE).fill('hidden'));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [gemsFound, setGemsFound] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateMultiplier = (gems: number, mines: number): number => {
    const totalCells = GRID_SIZE;
    const safeCells = totalCells - mines;
    if (gems === 0) return 1.0;
    
    let multiplier = 1.0;
    for (let i = 0; i < gems; i++) {
      multiplier *= (totalCells - i) / (safeCells - i);
    }
    return multiplier * 0.97;
  };

  const generateMinePositions = (count: number): number[] => {
    const positions: number[] = [];
    
    while (positions.length < count) {
      const pos = Math.floor(Math.random() * GRID_SIZE);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    
    return positions;
  };

  const startGame = async () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    const betAmount = parseFloat(bet);
    const mines = parseInt(minesCount);

    if (isNaN(betAmount) || betAmount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную ставку',
        variant: 'destructive'
      });
      return;
    }

    if (mines < 1 || mines > 20) {
      toast({
        title: 'Ошибка',
        description: 'Количество мин: от 1 до 20',
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
          game_type: 'Mines'
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

      triggerUserSync();
      onRefreshUserBalance?.();

      const positions = generateMinePositions(mines);
      setMinePositions(positions);
      setGrid(Array(GRID_SIZE).fill('hidden'));
      setGemsFound(0);
      setCurrentMultiplier(1.0);
      setGameState('playing');
      setResult('');
      setIsProcessing(false);

    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  const revealCell = async (index: number) => {
    if (gameState !== 'playing' || grid[index] !== 'hidden' || isProcessing) return;

    const newGrid = [...grid];
    
    if (minePositions.includes(index)) {
      newGrid[index] = 'mine';
      setGrid(newGrid);
      
      minePositions.forEach(pos => {
        newGrid[pos] = 'mine';
      });
      setGrid(newGrid);
      
      await handleLoss();
    } else {
      newGrid[index] = 'gem';
      setGrid(newGrid);
      
      const newGemsFound = gemsFound + 1;
      setGemsFound(newGemsFound);
      
      const newMultiplier = calculateMultiplier(newGemsFound, minePositions.length);
      setCurrentMultiplier(newMultiplier);
    }
  };

  const cashout = async () => {
    if (gameState !== 'playing' || gemsFound === 0) return;

    setIsProcessing(true);
    const betAmount = parseFloat(bet);
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
          game_type: 'Mines'
        })
      });

      setResult(`💎 Найдено ${gemsFound} алмазов! Выигрыш: ${winAmount.toFixed(2)} USDT (${currentMultiplier.toFixed(2)}x)`);
      setGameState('finished');
      
      const newGrid = [...grid];
      minePositions.forEach(pos => {
        if (newGrid[pos] === 'hidden') {
          newGrid[pos] = 'mine';
        }
      });
      setGrid(newGrid);
      
      toast({
        title: '🎉 Успешный вывод!',
        description: `+${winAmount.toFixed(2)} USDT`,
        variant: 'default'
      });

      triggerUserSync();
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

  const handleLoss = async () => {
    setIsProcessing(true);
    const betAmount = parseFloat(bet);

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
          game_type: 'Mines'
        })
      });

      setResult(`💣 Взрыв! Вы проиграли ${betAmount.toFixed(2)} USDT`);
      setGameState('finished');
      
      toast({
        title: '😔 Мина!',
        description: `-${betAmount.toFixed(2)} USDT`,
        variant: 'destructive'
      });

      triggerUserSync();
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
    setGrid(Array(GRID_SIZE).fill('hidden'));
    setMinePositions([]);
    setGemsFound(0);
    setCurrentMultiplier(1.0);
    setResult('');
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">💎 Mines</h1>
        <p className="text-sm text-muted-foreground">
          Найдите алмазы и избегайте мин. Чем больше найдете, тем выше множитель!
        </p>
      </div>

      <Card className="p-4 md:p-6 bg-gradient-to-b from-gray-950/40 via-gray-900/30 to-gray-950/40 border-gray-800/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-800/5 via-transparent to-transparent"></div>
        
        <div className="relative space-y-4">
          {gameState === 'betting' && (
            <div className="space-y-3">
              <div className="p-3 md:p-4 bg-gray-800/20 border border-gray-700/30 rounded-lg space-y-3">
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
                    <label className="block text-xs font-medium mb-1.5">Мины (1-20)</label>
                    <Input
                      type="number"
                      value={minesCount}
                      onChange={(e) => setMinesCount(e.target.value)}
                      min="1"
                      max="20"
                      step="1"
                      placeholder="3"
                      disabled={!user}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 h-11"
                disabled={!user || isProcessing}
              >
                <Icon name="Play" size={18} className="mr-2" />
                {user ? 'Начать' : 'Войдите для игры'}
              </Button>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'finished') && (
            <>
              <div className="grid grid-cols-3 gap-2 p-3 bg-purple-800/20 border border-purple-700/30 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Алмазы</div>
                  <div className="text-xl md:text-2xl font-bold text-cyan-400">{gemsFound}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Множитель</div>
                  <div className="text-xl md:text-2xl font-bold text-green-400">{currentMultiplier.toFixed(2)}x</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Выигрыш</div>
                  <div className="text-xl md:text-2xl font-bold text-yellow-400">
                    {(parseFloat(bet) * currentMultiplier).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                {grid.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => revealCell(index)}
                    disabled={gameState !== 'playing' || cell !== 'hidden' || isProcessing}
                    className={`aspect-square rounded-lg flex items-center justify-center text-2xl md:text-3xl font-bold transition-all duration-300 ${
                      cell === 'hidden'
                        ? 'bg-gray-700 hover:bg-gray-600 hover:scale-105 cursor-pointer shadow-lg active:scale-95'
                        : cell === 'gem'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 scale-105 shadow-xl'
                        : 'bg-gradient-to-br from-red-600 to-red-800 scale-105 shadow-xl'
                    } ${gameState !== 'playing' || cell !== 'hidden' ? 'cursor-not-allowed' : ''}`}
                  >
                    {cell === 'gem' && '💎'}
                    {cell === 'mine' && '💣'}
                  </button>
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

              {gameState === 'playing' && gemsFound > 0 && (
                <Button
                  onClick={cashout}
                  className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 h-11 font-bold"
                  disabled={isProcessing}
                >
                  <Icon name="DollarSign" size={18} className="mr-2" />
                  Забрать {(parseFloat(bet) * currentMultiplier).toFixed(2)} USDT
                </Button>
              )}

              {gameState === 'finished' && (
                <Button
                  onClick={resetGame}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 h-11"
                >
                  <Icon name="RotateCcw" size={18} className="mr-2" />
                  Новая игра
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-card/50">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Icon name="Info" size={18} className="text-purple-400" />
          Правила игры
        </h3>
        <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
          <p>• <strong>Цель:</strong> открывать ячейки с алмазами</p>
          <p>• <strong>Множитель:</strong> растет с каждым алмазом</p>
          <p>• <strong>Мины:</strong> 1-20 (больше мин = выше множитель)</p>
          <p>• <strong>Минимум:</strong> 0.1 USDT</p>
        </div>
      </Card>
    </div>
  );
};

export default MinesGame;