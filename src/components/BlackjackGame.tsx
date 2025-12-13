import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { triggerUserSync } from '@/utils/userSync';
import { PlayingCard, createDeck, calculateHandValue } from './blackjack/blackjack-utils';
import { BlackjackCard } from './blackjack/BlackjackCard';
import { BlackjackControls } from './blackjack/BlackjackControls';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface BlackjackGameProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

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

      triggerUserSync();
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
        triggerUserSync();
        triggerUserSync();
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
                  <BlackjackCard 
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
                  <BlackjackCard key={index} card={card} />
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <BlackjackControls
            gameState={gameState}
            bet={bet}
            setBet={setBet}
            user={user}
            isProcessing={isProcessing}
            result={result}
            onStartNewGame={startNewGame}
            onHit={hit}
            onStand={() => stand()}
            onResetGame={resetGame}
          />
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