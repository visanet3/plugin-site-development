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
  const [sessionLoaded, setSessionLoaded] = useState(false);

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
      const betResponse = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'place_bet',
          amount: betAmount,
          game_type: 'Baccarat'
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
        const shouldWin = Math.random() < 0.37;
        
        if (shouldWin) {
          winner = betType;
        } else {
          if (finalPlayerValue > finalBankerValue) winner = 'player';
          else if (finalBankerValue > finalPlayerValue) winner = 'banker';
          else winner = 'tie';
        }

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

        finishGame(won || (isTie && betType !== 'tie'), winAmount, winner, betAmount);
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

  const finishGame = async (won: boolean, winAmount: number, winner: 'player' | 'banker' | 'tie', betAmount: number) => {
    try {
      const isTie = winner === 'tie' && betType !== 'tie';
      
      if (won || isTie) {
        await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user!.id.toString()
          },
          body: JSON.stringify({
            action: 'complete_game',
            won: won && !isTie,
            is_draw: isTie,
            amount: winAmount,
            bet_amount: betAmount,
            game_type: 'Baccarat'
          })
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
            is_draw: false,
            amount: 0,
            bet_amount: betAmount,
            game_type: 'Baccarat'
          })
        });
      }
      
      let resultText = '';
      if (winner === 'tie') {
        if (betType === 'tie') {
          resultText = `Ничья! Вы выиграли ${winAmount.toFixed(2)} USDT`;
          toast({
            title: '🎉 Победа!',
            description: `+${winAmount.toFixed(2)} USDT`,
            variant: 'default'
          });
        } else {
          resultText = `Ничья! Возврат ставки ${winAmount.toFixed(2)} USDT`;
          toast({
            title: 'Ничья',
            description: `Возврат ${winAmount.toFixed(2)} USDT`,
            variant: 'default'
          });
        }
      } else if (won) {
        resultText = `Победа ${winner === 'player' ? 'Игрока' : 'Банкира'}! Вы выиграли ${winAmount.toFixed(2)} USDT`;
        toast({
          title: '🎉 Победа!',
          description: `+${winAmount.toFixed(2)} USDT`,
          variant: 'default'
        });
      } else {
        resultText = `Победа ${winner === 'player' ? 'Игрока' : 'Банкира'}. Вы проиграли ${betAmount.toFixed(2)} USDT`;
        toast({
          title: '😔 Проигрыш',
          description: `-${betAmount.toFixed(2)} USDT`,
          variant: 'destructive'
        });
      }

      setResult(resultText);
      setGameState('finished');
      
      await clearGameSession();
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
          game_type: 'baccarat'
        })
      });
    } catch (error) {
      console.error('Ошибка очистки сессии:', error);
    }
  };

  const resetGame = async () => {
    await clearGameSession();
    setPlayerHand([]);
    setBankerHand([]);
    setDeck(createDeck());
    setResult('');
    setGameState('betting');
    setBetType(null);
    setSessionLoaded(false);
  };

  const CardDisplay = ({ card }: { card: PlayingCard }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    
    return (
      <div className="w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24 bg-white rounded-lg shadow-lg flex flex-col items-center justify-between p-1 sm:p-1.5">
        <div className={`text-sm sm:text-base md:text-lg font-bold ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
          {card.rank}
        </div>
        <div className={`text-lg sm:text-xl md:text-2xl ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
          {card.suit}
        </div>
        <div className={`text-sm sm:text-base md:text-lg font-bold ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
          {card.rank}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">Баккара</h2>
        <p className="text-sm text-muted-foreground">
          Ставьте на Игрока, Банкира или Ничью
        </p>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          {/* Game Display */}
          {gameState !== 'betting' && (
            <>
              {/* Banker Hand */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Банкир</h3>
                  <span className="text-sm text-muted-foreground">
                    Счет: {calculateHandValue(bankerHand)}
                  </span>
                </div>
                <div className="flex gap-2 justify-center min-h-[4rem] sm:min-h-[5rem] md:min-h-[6rem]">
                  {bankerHand.map((card, index) => (
                    <CardDisplay key={index} card={card} />
                  ))}
                </div>
              </div>

              {/* Player Hand */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Игрок</h3>
                  <span className="text-sm text-muted-foreground">
                    Счет: {calculateHandValue(playerHand)}
                  </span>
                </div>
                <div className="flex gap-2 justify-center min-h-[4rem] sm:min-h-[5rem] md:min-h-[6rem]">
                  {playerHand.map((card, index) => (
                    <CardDisplay key={index} card={card} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Betting Section */}
          {gameState === 'betting' && (
            <div className="space-y-3">
              {/* Bet Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Тип ставки</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={betType === 'player' ? 'default' : 'outline'}
                    className="h-11 flex flex-col items-center justify-center gap-0.5"
                    onClick={() => setBetType('player')}
                  >
                    <span className="text-xs sm:text-sm">Игрок</span>
                    <span className="text-xs text-muted-foreground">x2</span>
                  </Button>
                  <Button
                    variant={betType === 'banker' ? 'default' : 'outline'}
                    className="h-11 flex flex-col items-center justify-center gap-0.5"
                    onClick={() => setBetType('banker')}
                  >
                    <span className="text-xs sm:text-sm">Банкир</span>
                    <span className="text-xs text-muted-foreground">x1.95</span>
                  </Button>
                  <Button
                    variant={betType === 'tie' ? 'default' : 'outline'}
                    className="h-11 flex flex-col items-center justify-center gap-0.5"
                    onClick={() => setBetType('tie')}
                  >
                    <span className="text-xs sm:text-sm">Ничья</span>
                    <span className="text-xs text-muted-foreground">x8</span>
                  </Button>
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
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <Button
                onClick={startNewGame}
                className="w-full h-12 md:h-14 text-base font-semibold"
                disabled={!betType || isProcessing}
              >
                {isProcessing ? (
                  <Icon name="loader-2" className="w-5 h-5 animate-spin" />
                ) : (
                  'Начать игру'
                )}
              </Button>
            </div>
          )}

          {/* Result */}
          {gameState === 'finished' && result && (
            <div className="space-y-3">
              <div className={`text-center text-sm sm:text-base font-medium p-3 rounded-lg ${
                result.includes('выиграли') || result.includes('Возврат')
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {result}
              </div>
              <Button
                onClick={resetGame}
                className="w-full h-12 md:h-14 text-base font-semibold"
              >
                Новая игра
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
            <span>Цель - угадать у кого больше очков (от 0 до 9)</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Туз = 1, картинки и 10 = 0, остальные по номиналу</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Ставка на Игрока - выигрыш x2</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Ставка на Банкира - выигрыш x1.95 (комиссия 5%)</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Ставка на Ничью - выигрыш x8</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default BaccaratGame;