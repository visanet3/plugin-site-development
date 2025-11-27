import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface PokerGameProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface PlayingCard {
  suit: Suit;
  rank: Rank;
}

const createDeck = (): PlayingCard[] => {
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: PlayingCard[] = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  
  return deck.sort(() => Math.random() - 0.5);
};

const rankValues: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const evaluateHand = (hand: PlayingCard[]): { rank: number; name: string } => {
  const sorted = [...hand].sort((a, b) => rankValues[b.rank] - rankValues[a.rank]);
  const ranks = sorted.map(c => c.rank);
  const suits = sorted.map(c => c.suit);
  
  const rankCounts: Record<string, number> = {};
  ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
  const isFlush = suits.every(s => s === suits[0]);
  const rankNums = ranks.map(r => rankValues[r]);
  const isStraight = rankNums.every((v, i) => i === 0 || v === rankNums[i - 1] - 1) ||
    (ranks[0] === 'A' && ranks[1] === '5' && ranks[2] === '4' && ranks[3] === '3' && ranks[4] === '2');
  
  if (isFlush && isStraight) return { rank: 9, name: 'Стрит-флеш' };
  if (counts[0] === 4) return { rank: 8, name: 'Каре' };
  if (counts[0] === 3 && counts[1] === 2) return { rank: 7, name: 'Фулл-хаус' };
  if (isFlush) return { rank: 6, name: 'Флеш' };
  if (isStraight) return { rank: 5, name: 'Стрит' };
  if (counts[0] === 3) return { rank: 4, name: 'Тройка' };
  if (counts[0] === 2 && counts[1] === 2) return { rank: 3, name: 'Две пары' };
  if (counts[0] === 2) return { rank: 2, name: 'Пара' };
  return { rank: 1, name: 'Старшая карта' };
};

const PokerGame = ({ user, onShowAuthDialog, onRefreshUserBalance }: PokerGameProps) => {
  const { toast } = useToast();
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [bet, setBet] = useState('10');
  const [gameState, setGameState] = useState<'betting' | 'decision' | 'showdown' | 'finished'>('betting');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [playerHandRank, setPlayerHandRank] = useState<{ rank: number; name: string } | null>(null);
  const [dealerHandRank, setDealerHandRank] = useState<{ rank: number; name: string } | null>(null);

  useEffect(() => {
    setDeck(createDeck());
  }, []);

  const startNewGame = async () => {
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
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'place_bet',
          amount: betAmount,
          game_type: 'poker'
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
        return;
      }

      const newDeck = createDeck();
      const newPlayerHand = [newDeck[0], newDeck[2], newDeck[4], newDeck[6], newDeck[8]];
      const newDealerHand = [newDeck[1], newDeck[3], newDeck[5], newDeck[7], newDeck[9]];

      setDeck(newDeck.slice(10));
      setPlayerHand(newPlayerHand);
      setDealerHand(newDealerHand);
      setPlayerHandRank(evaluateHand(newPlayerHand));
      setDealerHandRank(null);
      setGameState('decision');
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

  const fold = async () => {
    setIsProcessing(true);
    
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
          game_type: 'poker'
        })
      });

      setResult('Вы сбросили карты. Ставка потеряна');
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

  const call = async () => {
    setIsProcessing(true);
    const betAmount = parseFloat(bet);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user!.id.toString()
        },
        body: JSON.stringify({
          action: 'place_bet',
          amount: betAmount,
          game_type: 'poker'
        })
      });

      const data = await response.json();
      if (!data.success) {
        toast({
          title: 'Ошибка',
          description: data.message || 'Недостаточно средств для колла',
          variant: 'destructive'
        });
        setIsProcessing(false);
        return;
      }

      setGameState('showdown');
      const dealerRank = evaluateHand(dealerHand);
      setDealerHandRank(dealerRank);

      setTimeout(() => {
        finishGame(dealerRank, betAmount * 2);
      }, 1000);

    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  const finishGame = async (dealerRank: { rank: number; name: string }, totalBet: number) => {
    const playerRank = playerHandRank!;
    let won = false;
    let isDraw = false;
    let winAmount = 0;

    const shouldWin = Math.random() < 0.3;
    
    if (shouldWin) {
      won = true;
      winAmount = totalBet * 2;
    } else {
      if (playerRank.rank > dealerRank.rank) {
        won = true;
        winAmount = totalBet * 2;
      } else if (playerRank.rank === dealerRank.rank) {
        isDraw = true;
        winAmount = totalBet;
      }
    }

    try {
      await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user!.id.toString()
        },
        body: JSON.stringify({
          action: 'complete_game',
          won: won,
          is_draw: isDraw,
          amount: winAmount,
          bet_amount: totalBet,
          game_type: 'Poker'
        })
      });

      if (playerRank.rank > dealerRank.rank) {
        setResult(`Вы победили! ${playerRank.name} против ${dealerRank.name}\nВыигрыш: ${winAmount.toFixed(2)} USDT`);
      } else if (playerRank.rank === dealerRank.rank) {
        setResult(`Ничья! Обе комбинации: ${playerRank.name}\nСтавка возвращена`);
      } else {
        setResult(`Дилер победил. ${dealerRank.name} против ${playerRank.name}\nВы проиграли`);
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
    setPlayerHand([]);
    setDealerHand([]);
    setResult('');
    setGameState('betting');
    setPlayerHandRank(null);
    setDealerHandRank(null);
    setDeck(createDeck());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Покер</h1>
        <p className="text-muted-foreground">
          5-карточный покер против дилера. Соберите лучшую комбинацию
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-b from-blue-950/40 via-blue-900/30 to-blue-950/40 border-blue-800/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-800/5 via-transparent to-transparent"></div>
        
        <div className="relative space-y-8">
          <div className="space-y-6 pb-6 border-b border-blue-800/20">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-800/30 to-blue-900/20 border-2 border-blue-800/40 flex items-center justify-center">
                <Icon name="User" size={28} className="text-blue-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-blue-400">Дилер</h3>
                {dealerHandRank && (
                  <p className="text-sm text-muted-foreground">{dealerHandRank.name}</p>
                )}
              </div>
            </div>
            {dealerHand.length > 0 && (
              <div className="flex gap-2 sm:gap-2.5 justify-center flex-wrap">
                {dealerHand.map((card, i) => (
                  <div
                    key={i}
                    className={`w-12 h-18 sm:w-16 sm:h-24 rounded-md sm:rounded-lg flex flex-col items-center justify-center text-lg sm:text-2xl font-bold shadow-2xl transform transition-all duration-300 ${
                      gameState === 'showdown' || gameState === 'finished'
                        ? `bg-white ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`
                        : 'bg-gradient-to-br from-blue-600 to-blue-800 text-white'
                    }`}
                    style={{ 
                      transform: `rotateX(-5deg) rotateY(${i * 2 - dealerHand.length}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {gameState === 'showdown' || gameState === 'finished' ? (
                      <>
                        <span>{card.rank}</span>
                        <span className="text-base sm:text-xl">{card.suit}</span>
                      </>
                    ) : (
                      <Icon name="HelpCircle" size={24} className="sm:w-9 sm:h-9" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="py-8 relative">
            <div className="relative h-32 bg-blue-800/20 rounded-2xl border-4 border-blue-800/30 flex items-center justify-center shadow-inner">
              <Icon name="Club" size={64} className="text-blue-800/30" />
              <div className="absolute top-4 left-4 text-xs font-bold text-blue-800/40">POKER</div>
              <div className="absolute bottom-4 right-4 text-xs font-bold text-blue-800/40">5 CARD</div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-blue-800/20">
            {playerHand.length > 0 && (
              <div className="flex gap-2 sm:gap-2.5 justify-center flex-wrap">
                {playerHand.map((card, i) => (
                  <div
                    key={i}
                    className={`w-12 h-18 sm:w-16 sm:h-24 bg-white rounded-md sm:rounded-lg flex flex-col items-center justify-center text-lg sm:text-2xl font-bold shadow-2xl transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 ${
                      card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                    }`}
                    style={{ 
                      transform: `rotateX(5deg) rotateY(${i * 2 - playerHand.length}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <span>{card.rank}</span>
                    <span className="text-base sm:text-xl">{card.suit}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-cyan-400">Вы</h3>
                {playerHandRank && (
                  <p className="text-sm text-muted-foreground">{playerHandRank.name}</p>
                )}
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 border-2 border-cyan-500/40 flex items-center justify-center">
                <Icon name="UserCircle2" size={28} className="text-cyan-400" />
              </div>
            </div>
          </div>

          {result && (
            <Card className={`p-4 text-center ${
              result.includes('победили') ? 'bg-green-800/20 border-green-800/30' : 
              result.includes('Ничья') || result.includes('возвращена') ? 'bg-gray-800/20 border-gray-800/30' : 
              'bg-red-800/20 border-red-800/30'
            }`}>
              <p className="text-lg font-semibold whitespace-pre-line">{result}</p>
            </Card>
          )}

          {gameState === 'betting' && (
            <div className="space-y-4">
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
                />
              </div>
              <Button
                onClick={startNewGame}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                disabled={!user || isProcessing}
              >
                <Icon name="Play" size={18} className="mr-2" />
                {user ? 'Начать игру' : 'Войдите для игры'}
              </Button>
            </div>
          )}

          {gameState === 'decision' && (
            <div className="flex gap-3">
              <Button
                onClick={fold}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isProcessing}
              >
                <Icon name="X" size={18} className="mr-2" />
                Сброс
              </Button>
              <Button
                onClick={call}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isProcessing}
              >
                <Icon name="Check" size={18} className="mr-2" />
                Колл (x2 ставка)
              </Button>
            </div>
          )}

          {gameState === 'finished' && (
            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
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
          <Icon name="Info" size={20} className="text-blue-400" />
          Правила игры
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• <strong>Раздача:</strong> вам и дилеру раздается по 5 карт</p>
          <p>• <strong>Решение:</strong> сброс (проигрыш) или колл (удвоение ставки)</p>
          <p>• <strong>Комбинации:</strong> стрит-флеш, каре, фулл-хаус, флеш, стрит, тройка, две пары, пара, старшая карта</p>
          <p>• <strong>Выигрыш:</strong> побеждает лучшая комбинация, выплата x2 от общей ставки</p>
          <p>• <strong>Ничья:</strong> при одинаковых комбинациях ставка возвращается</p>
        </div>
      </Card>
    </div>
  );
};

export default PokerGame;