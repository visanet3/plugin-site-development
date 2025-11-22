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

  const startNewGame = () => {
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

    if (betAmount > (user.balance || 0)) {
      toast({
        title: 'Недостаточно средств',
        description: `У вас: ${(user.balance || 0).toFixed(2)} USDT`,
        variant: 'destructive'
      });
      return;
    }

    const newDeck = createDeck();
    const playerCards = [newDeck.pop()!, newDeck.pop()!];
    const dealerCards = [newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setPlayerHand(playerCards);
    setDealerHand(dealerCards);
    setGameState('playing');
    setResult('');

    const playerValue = calculateHandValue(playerCards);
    if (playerValue === 21) {
      finishGame(playerCards, dealerCards, newDeck);
    }
  };

  const hit = () => {
    if (gameState !== 'playing' || deck.length === 0) return;

    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const newHand = [...playerHand, newCard];
    
    setDeck(newDeck);
    setPlayerHand(newHand);

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
    let winAmount = 0;

    if (playerValue > 21) {
      gameResult = 'Перебор! Дилер выиграл';
      winAmount = -betAmount;
    } else if (dealerValue > 21) {
      gameResult = 'Дилер перебрал! Вы выиграли!';
      winAmount = betAmount;
    } else if (playerValue > dealerValue) {
      gameResult = 'Вы выиграли!';
      winAmount = betAmount;
    } else if (playerValue < dealerValue) {
      gameResult = 'Дилер выиграл';
      winAmount = -betAmount;
    } else {
      gameResult = 'Ничья';
      winAmount = 0;
    }

    setResult(gameResult);

    if (user && winAmount !== 0) {
      try {
        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify({
            action: 'topup_balance',
            amount: winAmount,
            type: winAmount > 0 ? 'blackjack_win' : 'blackjack_loss',
            description: winAmount > 0 ? 'Выигрыш в Блэкджек' : 'Проигрыш в Блэкджек'
          })
        });

        const data = await response.json();
        if (data.success) {
          onRefreshUserBalance?.();
          toast({
            title: winAmount > 0 ? '🎉 Победа!' : '😔 Проигрыш',
            description: `${winAmount > 0 ? '+' : ''}${winAmount.toFixed(2)} USDT`,
            variant: winAmount > 0 ? 'default' : 'destructive'
          });
        }
      } catch (error) {
        console.error('Ошибка обновления баланса:', error);
      }
    }

    setIsProcessing(false);
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setDeck([]);
    setGameState('betting');
    setResult('');
  };

  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Казино</h1>
        <p className="text-muted-foreground">
          Классическая карточная игра. Наберите 21 очко или больше чем у дилера
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-b from-green-950/40 via-green-900/30 to-green-950/40 border-green-800/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-800/5 via-transparent to-transparent"></div>
        
        <div className="relative space-y-8">
          <div className="space-y-6 pb-6 border-b border-green-800/20">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-800/30 to-green-900/20 border-2 border-green-800/40 flex items-center justify-center">
                <Icon name="User" size={28} className="text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-400">Дилер</h3>
                <p className="text-sm text-muted-foreground">
                  {gameState === 'betting' || gameState === 'playing' ? 'Очки: ?' : `Очки: ${dealerValue}`}
                </p>
              </div>
            </div>
            {dealerHand.length > 0 && gameState !== 'betting' && (
              <div className="flex gap-3 justify-center perspective-1000">
                {dealerHand.map((card, i) => (
                  <div
                    key={i}
                    className={`w-20 h-28 bg-white rounded-xl flex flex-col items-center justify-center text-3xl font-bold shadow-2xl transform transition-all duration-300 hover:scale-105 ${
                      gameState === 'playing' && i === 1 ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white' : card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                    }`}
                    style={{ 
                      transform: `rotateX(-5deg) rotateY(${i * 2 - dealerHand.length}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {gameState === 'playing' && i === 1 ? (
                      <Icon name="HelpCircle" size={36} />
                    ) : (
                      <>
                        <span>{card.rank}</span>
                        <span className="text-2xl">{card.suit}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="py-8 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-800/10 to-transparent rounded-2xl"></div>
            <div className="relative h-32 bg-green-800/20 rounded-2xl border-4 border-green-800/30 flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-700/5 to-transparent"></div>
              <Icon name="Spade" size={64} className="text-green-800/30 relative z-10" />
              <div className="absolute top-4 left-4 text-xs font-bold text-green-800/40">BLACKJACK</div>
              <div className="absolute bottom-4 right-4 text-xs font-bold text-green-800/40">21</div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-green-800/20">
            {playerHand.length > 0 && (
              <div className="flex gap-3 justify-center perspective-1000">
                {playerHand.map((card, i) => (
                  <div
                    key={i}
                    className={`w-20 h-28 bg-white rounded-xl flex flex-col items-center justify-center text-3xl font-bold shadow-2xl transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 ${
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
                <h3 className="text-xl font-bold text-cyan-400">Вы</h3>
                <p className="text-sm text-muted-foreground">Очки: {playerValue}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 border-2 border-cyan-500/40 flex items-center justify-center">
                <Icon name="UserCircle2" size={28} className="text-cyan-400" />
              </div>
            </div>
          </div>

          {result && (
            <Card className={`p-4 text-center ${
              result.includes('выиграли') ? 'bg-green-800/20 border-green-800/30' : 
              result.includes('Ничья') ? 'bg-gray-800/20 border-gray-800/30' : 
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
              <Button
                onClick={startNewGame}
                className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
                disabled={!user || isProcessing}
              >
                <Icon name="Play" size={18} className="mr-2" />
                {user ? 'Начать игру' : 'Войдите для игры'}
              </Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="flex gap-3">
              <Button
                onClick={hit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isProcessing}
              >
                <Icon name="Plus" size={18} className="mr-2" />
                Взять карту
              </Button>
              <Button
                onClick={() => stand()}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={isProcessing}
              >
                <Icon name="Hand" size={18} className="mr-2" />
                Хватит
              </Button>
            </div>
          )}

          {gameState === 'finished' && (
            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
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
          <p>• <strong>Цель:</strong> набрать 21 очко или больше чем у дилера, но не более 21</p>
          <p>• <strong>Карты:</strong> 2-10 = номинал, J/Q/K = 10, туз = 1 или 11</p>
          <p>• <strong>Ход игры:</strong> дилер раздает по 2 карты, одна карта дилера скрыта</p>
          <p>• <strong>Взять карту:</strong> получить дополнительную карту</p>
          <p>• <strong>Хватит:</strong> остановиться и передать ход дилеру</p>
          <p>• <strong>Дилер:</strong> обязан брать карты до 17 очков</p>
          <p>• <strong>Выигрыш:</strong> при победе вы получаете x2 от ставки</p>
        </div>
      </Card>
    </div>
  );
};