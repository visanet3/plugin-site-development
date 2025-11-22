import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface BaccaratGameProps {
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

type BetType = 'player' | 'banker' | 'tie' | null;

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

const getCardValue = (card: PlayingCard): number => {
  if (['J', 'Q', 'K', '10'].includes(card.rank)) return 0;
  if (card.rank === 'A') return 1;
  return parseInt(card.rank);
};

const calculateHandValue = (hand: PlayingCard[]): number => {
  const total = hand.reduce((sum, card) => sum + getCardValue(card), 0);
  return total % 10;
};

const BaccaratGame = ({ user, onShowAuthDialog, onRefreshUserBalance }: BaccaratGameProps) => {
  const { toast } = useToast();
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [bankerHand, setBankerHand] = useState<PlayingCard[]>([]);
  const [bet, setBet] = useState('10');
  const [betType, setBetType] = useState<BetType>(null);
  const [gameState, setGameState] = useState<'betting' | 'dealing' | 'finished'>('betting');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setDeck(createDeck());
  }, []);

  const startNewGame = async (e?: React.MouseEvent) => {
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
          game_type: 'baccarat'
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
      const newPlayerHand = [newDeck[0], newDeck[2]];
      const newBankerHand = [newDeck[1], newDeck[3]];
      const remainingDeck = newDeck.slice(4);

      setDeck(remainingDeck);
      setPlayerHand(newPlayerHand);
      setBankerHand(newBankerHand);
      setGameState('dealing');

      setTimeout(() => {
        const finalPlayerHand = [...newPlayerHand];
        const finalBankerHand = [...newBankerHand];
        let deckIndex = 0;

        const playerValue = calculateHandValue(finalPlayerHand);
        const bankerValue = calculateHandValue(finalBankerHand);

        if (playerValue < 8 && bankerValue < 8) {
          if (playerValue <= 5) {
            finalPlayerHand.push(remainingDeck[deckIndex++]);
          }
          
          const newPlayerValue = calculateHandValue(finalPlayerHand);
          const playerThirdCard = finalPlayerHand[2] ? getCardValue(finalPlayerHand[2]) : null;
          
          let bankerDraws = false;
          if (playerThirdCard === null) {
            bankerDraws = bankerValue <= 5;
          } else {
            if (bankerValue <= 2) bankerDraws = true;
            else if (bankerValue === 3 && playerThirdCard !== 8) bankerDraws = true;
            else if (bankerValue === 4 && [2, 3, 4, 5, 6, 7].includes(playerThirdCard)) bankerDraws = true;
            else if (bankerValue === 5 && [4, 5, 6, 7].includes(playerThirdCard)) bankerDraws = true;
            else if (bankerValue === 6 && [6, 7].includes(playerThirdCard)) bankerDraws = true;
          }
          
          if (bankerDraws) {
            finalBankerHand.push(remainingDeck[deckIndex++]);
          }
        }

        setPlayerHand(finalPlayerHand);
        setBankerHand(finalBankerHand);
        
        const finalPlayerValue = calculateHandValue(finalPlayerHand);
        const finalBankerValue = calculateHandValue(finalBankerHand);

        let winner: 'player' | 'banker' | 'tie';
        if (finalPlayerValue > finalBankerValue) winner = 'player';
        else if (finalBankerValue > finalPlayerValue) winner = 'banker';
        else winner = 'tie';

        const won = winner === betType;
        const isTie = winner === 'tie';
        
        let winAmount = 0;
        if (won) {
          if (betType === 'tie') {
            winAmount = betAmount * 8;
          } else if (betType === 'banker') {
            winAmount = betAmount * 1.95;
          } else {
            winAmount = betAmount * 2;
          }
        } else if (isTie && betType !== 'tie') {
          winAmount = betAmount;
        }

        finishGame(won || (isTie && betType !== 'tie'), winAmount, winner);
      }, 1500);

    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  const finishGame = async (won: boolean, winAmount: number, winner: 'player' | 'banker' | 'tie') => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user!.id.toString()
        },
        body: JSON.stringify({
          action: 'complete_game',
          won: won,
          amount: winAmount,
          game_type: 'baccarat'
        })
      });

      const data = await response.json();
      
      let resultText = '';
      if (winner === 'tie') {
        resultText = betType === 'tie' ? `Ничья! Вы выиграли ${winAmount.toFixed(2)} USDT` : 'Ничья! Ставка возвращена';
      } else {
        const winnerText = winner === 'player' ? 'Игрок' : 'Банкир';
        resultText = won ? `${winnerText} победил! Вы выиграли ${winAmount.toFixed(2)} USDT` : `${winnerText} победил! Вы проиграли`;
      }
      
      setResult(resultText);
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

  const resetGame = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setPlayerHand([]);
    setBankerHand([]);
    setResult('');
    setGameState('betting');
    setBetType(null);
    setDeck(createDeck());
  };

  const playerValue = calculateHandValue(playerHand);
  const bankerValue = calculateHandValue(bankerHand);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Баккара</h1>
        <p className="text-muted-foreground">
          Делайте ставки на игрока, банкира или ничью. Ближайший к 9 побеждает
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-b from-purple-950/40 via-purple-900/30 to-purple-950/40 border-purple-800/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-800/5 via-transparent to-transparent"></div>
        
        <div className="relative space-y-8">
          <div className="space-y-6 pb-6 border-b border-purple-800/20">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/20 border-2 border-red-500/40 flex items-center justify-center">
                <Icon name="Building2" size={28} className="text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-400">Банкир</h3>
                <p className="text-sm text-muted-foreground">
                  {gameState === 'betting' ? 'Ожидание' : `Очки: ${bankerValue}`}
                </p>
              </div>
            </div>
            {bankerHand.length > 0 && gameState !== 'betting' && (
              <div className="flex gap-3 justify-center">
                {bankerHand.map((card, i) => (
                  <div
                    key={i}
                    className={`w-20 h-28 bg-white rounded-xl flex flex-col items-center justify-center text-3xl font-bold shadow-2xl transform transition-all duration-300 ${
                      card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                    }`}
                    style={{ 
                      transform: `rotateX(-5deg) rotateY(${i * 2 - bankerHand.length}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <span>{card.rank}</span>
                    <span className="text-2xl">{card.suit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="py-8 relative">
            <div className="relative h-32 bg-purple-800/20 rounded-2xl border-4 border-purple-800/30 flex items-center justify-center shadow-inner">
              <Icon name="Diamond" size={64} className="text-purple-800/30" />
              <div className="absolute top-4 left-4 text-xs font-bold text-purple-800/40">BACCARAT</div>
              <div className="absolute bottom-4 right-4 text-xs font-bold text-purple-800/40">9</div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-purple-800/20">
            {playerHand.length > 0 && (
              <div className="flex gap-3 justify-center">
                {playerHand.map((card, i) => (
                  <div
                    key={i}
                    className={`w-20 h-28 bg-white rounded-xl flex flex-col items-center justify-center text-3xl font-bold shadow-2xl transform transition-all duration-300 ${
                      card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                    }`}
                    style={{ 
                      transform: `rotateX(5deg) rotateY(${i * 2 - playerHand.length}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <span>{card.rank}</span>
                    <span className="text-2xl">{card.suit}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-blue-400">Игрок</h3>
                <p className="text-sm text-muted-foreground">
                  {gameState === 'betting' ? 'Ожидание' : `Очки: ${playerValue}`}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center">
                <Icon name="User" size={28} className="text-blue-400" />
              </div>
            </div>
          </div>

          {result && (
            <Card className={`p-4 text-center ${
              result.includes('выиграли') ? 'bg-green-800/20 border-green-800/30' : 
              result.includes('Ничья') || result.includes('возвращена') ? 'bg-gray-800/20 border-gray-800/30' : 
              'bg-red-800/20 border-red-800/30'
            }`}>
              <p className="text-lg font-semibold">{result}</p>
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
              <div>
                <label className="block text-sm font-medium mb-2">Выберите тип ставки</label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => setBetType('player')}
                    variant={betType === 'player' ? 'default' : 'outline'}
                    className={betType === 'player' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Игрок (2x)
                  </Button>
                  <Button
                    onClick={() => setBetType('banker')}
                    variant={betType === 'banker' ? 'default' : 'outline'}
                    className={betType === 'banker' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Банкир (1.95x)
                  </Button>
                  <Button
                    onClick={() => setBetType('tie')}
                    variant={betType === 'tie' ? 'default' : 'outline'}
                    className={betType === 'tie' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    Ничья (8x)
                  </Button>
                </div>
              </div>
              <Button
                onClick={startNewGame}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                disabled={!user || isProcessing || !betType}
              >
                <Icon name="Play" size={18} className="mr-2" />
                {user ? 'Начать игру' : 'Войдите для игры'}
              </Button>
            </div>
          )}

          {gameState === 'finished' && (
            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
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
          <Icon name="Info" size={20} className="text-purple-400" />
          Правила игры
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• <strong>Цель:</strong> угадать, чья рука будет ближе к 9 очкам</p>
          <p>• <strong>Карты:</strong> A = 1, 2-9 = номинал, 10/J/Q/K = 0 очков</p>
          <p>• <strong>Счет:</strong> сумма карт по модулю 10 (например, 7+8=15 → 5 очков)</p>
          <p>• <strong>Ставки:</strong> на игрока (2x), банкира (1.95x) или ничью (8x)</p>
          <p>• <strong>Правила взятия:</strong> игрок берет при 0-5, банкир - по сложной таблице</p>
          <p>• <strong>Ничья:</strong> если ничья и вы ставили не на неё - ставка возвращается</p>
        </div>
      </Card>
    </div>
  );
};

export default BaccaratGame;