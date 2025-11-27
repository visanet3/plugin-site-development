import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface BlackjackGameProps {
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

const getCardValue = (card: PlayingCard, currentTotal: number): number => {
  if (card.rank === 'A') {
    return currentTotal + 11 > 21 ? 1 : 11;
  }
  if (['J', 'Q', 'K'].includes(card.rank)) {
    return 10;
  }
  return parseInt(card.rank);
};

const calculateHandValue = (hand: PlayingCard[]): number => {
  let total = 0;
  let aces = 0;
  
  for (const card of hand) {
    if (card.rank === 'A') {
      aces += 1;
      total += 11;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank);
    }
  }
  
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  
  return total;
};

export const BlackjackGame = ({ user, onShowAuthDialog, onRefreshUserBalance }: BlackjackGameProps) => {
  const { toast } = useToast();
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [bet, setBet] = useState<string>('1');
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer' | 'finished'>('betting');
  const [result, setResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const startNewGame = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!user) {
      onShowAuthDialog();
      return;
    }

    const betAmount = parseFloat(bet);
    if (!betAmount || betAmount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную ставку',
        variant: 'destructive'
      });
      return;
    }

    if (betAmount > Number(user.balance || 0)) {
      toast({
        title: 'Недостаточно средств',
        description: `У вас: ${Number(user.balance || 0).toFixed(2)} USDT`,
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
          game_type: 'Blackjack'
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
      const playerCards = [newDeck.pop()!, newDeck.pop()!];
      const dealerCards = [newDeck.pop()!, newDeck.pop()!];

      setDeck(newDeck);
      setPlayerHand(playerCards);
      setDealerHand(dealerCards);
      setGameState('playing');
      setResult('');

      await saveGameSession({
        deck: newDeck,
        playerHand: playerCards,
        dealerHand: dealerCards,
        betAmount
      });

      const playerValue = calculateHandValue(playerCards);
      if (playerValue === 21) {
        finishGame(playerCards, dealerCards, newDeck);
      }
    } catch (error) {
      console.error('Ошибка при начале игры:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось начать игру',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const hit = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (gameState !== 'playing' || deck.length === 0) return;

    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const newHand = [...playerHand, newCard];
    
    setDeck(newDeck);
    setPlayerHand(newHand);

    await saveGameSession({
      deck: newDeck,
      playerHand: newHand,
      dealerHand,
      betAmount: parseFloat(bet)
    });

    const value = calculateHandValue(newHand);
    if (value > 21) {
      finishGame(newHand, dealerHand, newDeck);
    } else if (value === 21) {
      stand(newHand, newDeck);
    }
  };

  const stand = (hand?: PlayingCard[], currentDeck?: PlayingCard[]) => {
    const finalPlayerHand = hand || playerHand;
    const finalDealerHand = [...dealerHand];
    const workingDeck = currentDeck ? [...currentDeck] : [...deck];

    setGameState('dealer');

    setTimeout(() => {
      while (calculateHandValue(finalDealerHand) < 17 && workingDeck.length > 0) {
        finalDealerHand.push(workingDeck.pop()!);
      }

      setDealerHand(finalDealerHand);
      setDeck(workingDeck);
      finishGame(finalPlayerHand, finalDealerHand, workingDeck);
    }, 500);
  };

  const finishGame = async (playerCards: PlayingCard[], dealerCards: PlayingCard[], finalDeck: PlayingCard[]) => {
    setGameState('finished');
    setIsProcessing(true);

    const playerValue = calculateHandValue(playerCards);
    const dealerValue = calculateHandValue(dealerCards);
    const betAmount = parseFloat(bet);

    let gameResult = '';
    let won = false;
    let isDraw = false;
    let winMultiplier = 0;

    if (playerValue > 21) {
      gameResult = 'Перебор! Дилер выиграл';
      won = false;
    } else if (dealerValue > 21) {
      gameResult = 'Дилер перебрал! Вы выиграли!';
      won = true;
      winMultiplier = 2;
    } else if (playerValue > dealerValue) {
      gameResult = 'Вы выиграли!';
      won = true;
      winMultiplier = 2;
    } else if (playerValue < dealerValue) {
      gameResult = 'Дилер выиграл';
      won = false;
    } else {
      gameResult = 'Ничья';
      isDraw = true;
      winMultiplier = 1;
    }

    setResult(gameResult);

    if (user) {
      try {
        if (won || isDraw) {
          const winAmount = betAmount * winMultiplier;
          await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': user.id.toString()
            },
            body: JSON.stringify({
              action: 'complete_game',
              won: true,
              amount: winAmount,
              bet_amount: betAmount,
              game_type: 'Blackjack'
            })
          });

          toast({
            title: won ? '🎉 Победа!' : 'Ничья',
            description: `${won ? '+' : ''}${winAmount.toFixed(2)} USDT`,
            variant: 'default'
          });
        } else {
          await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': user.id.toString()
            },
            body: JSON.stringify({
              action: 'complete_game',
              won: false,
              amount: 0,
              bet_amount: betAmount,
              game_type: 'Blackjack'
            })
          });

          toast({
            title: '😔 Проигрыш',
            description: `-${betAmount.toFixed(2)} USDT`,
            variant: 'destructive'
          });
        }

        await clearGameSession();
        onRefreshUserBalance?.();
      } catch (error) {
        console.error('Ошибка при завершении игры:', error);
      }
    }

    setIsProcessing(false);
  };

  const saveGameSession = async (data: any) => {
    if (!user) return;
    try {
      await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'save_game_session',
          game_type: 'blackjack',
          game_data: data
        })
      });
    } catch (error) {
      console.error('Ошибка сохранения сессии:', error);
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
          game_type: 'blackjack'
        })
      });
    } catch (error) {
      console.error('Ошибка очистки сессии:', error);
    }
  };

  const resetGame = async () => {
    await clearGameSession();
    setPlayerHand([]);
    setDealerHand([]);
    setDeck([]);
    setResult('');
    setGameState('betting');
    setSessionLoaded(false);
  };

  useEffect(() => {
    const loadSession = async () => {
      if (!user || sessionLoaded) return;

      try {
        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify({
            action: 'get_game_session',
            game_type: 'blackjack'
          })
        });

        const data = await response.json();
        if (data.success && data.session) {
          setDeck(data.session.deck || []);
          setPlayerHand(data.session.playerHand || []);
          setDealerHand(data.session.dealerHand || []);
          setBet(data.session.betAmount?.toString() || '1');
          setGameState('playing');
        }
      } catch (error) {
        console.error('Ошибка загрузки сессии:', error);
      }

      setSessionLoaded(true);
    };

    loadSession();
  }, [user, sessionLoaded]);

  const CardDisplay = ({ card, hidden = false }: { card: PlayingCard; hidden?: boolean }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    
    return (
      <div className={`
        w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 
        bg-white rounded-lg shadow-lg 
        flex flex-col items-center justify-between 
        p-1 sm:p-1.5 md:p-2
        ${hidden ? 'bg-gradient-to-br from-primary to-primary/80' : ''}
      `}>
        {hidden ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-10 sm:w-10 sm:h-12 border-2 border-white/30 rounded"></div>
          </div>
        ) : (
          <>
            <div className={`text-base sm:text-lg md:text-xl font-bold ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
              {card.rank}
            </div>
            <div className={`text-xl sm:text-2xl md:text-3xl ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
              {card.suit}
            </div>
            <div className={`text-base sm:text-lg md:text-xl font-bold ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
              {card.rank}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">Блэкджек</h2>
        <p className="text-sm text-muted-foreground">
          Наберите 21 или больше дилера
        </p>
      </div>

      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          {/* Dealer's Hand */}
          {gameState !== 'betting' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Дилер</h3>
                {gameState !== 'playing' && (
                  <span className="text-sm text-muted-foreground">
                    Счет: {calculateHandValue(dealerHand)}
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap justify-center min-h-[5rem] sm:min-h-[6rem] md:min-h-[7rem]">
                {dealerHand.map((card, index) => (
                  <CardDisplay 
                    key={index} 
                    card={card} 
                    hidden={gameState === 'playing' && index === 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Player's Hand */}
          {gameState !== 'betting' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Ваши карты</h3>
                <span className="text-sm text-muted-foreground">
                  Счет: {calculateHandValue(playerHand)}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap justify-center min-h-[5rem] sm:min-h-[6rem] md:min-h-[7rem]">
                {playerHand.map((card, index) => (
                  <CardDisplay key={index} card={card} />
                ))}
              </div>
            </div>
          )}

          {/* Betting Section */}
          {gameState === 'betting' && (
            <div className="space-y-3">
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

              <Button
                onClick={startNewGame}
                className="w-full h-12 md:h-14 text-base font-semibold"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Icon name="loader-2" className="w-5 h-5 animate-spin" />
                ) : (
                  'Начать игру'
                )}
              </Button>
            </div>
          )}

          {/* Game Actions */}
          {gameState === 'playing' && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={hit}
                className="h-11 text-sm font-semibold"
                disabled={isProcessing}
              >
                Взять карту
              </Button>
              <Button
                onClick={() => stand()}
                variant="outline"
                className="h-11 text-sm font-semibold"
                disabled={isProcessing}
              >
                Хватит
              </Button>
            </div>
          )}

          {/* Result */}
          {gameState === 'finished' && result && (
            <div className="space-y-3">
              <div className={`text-center text-base font-medium p-3 rounded-lg ${
                result.includes('выиграли') || result.includes('перебрал')
                  ? 'bg-green-500/10 text-green-500' 
                  : result.includes('Ничья')
                  ? 'bg-yellow-500/10 text-yellow-500'
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
            <span>Цель - набрать 21 или больше дилера, но не перебрать</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Туз = 1 или 11, картинки = 10</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Дилер берет карты до 17</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Выигрыш x2, ничья возврат ставки</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default BlackjackGame;