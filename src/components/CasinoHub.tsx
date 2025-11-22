import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import BlackjackGame from './BlackjackGame';
import BaccaratGame from './BaccaratGame';
import DiceGame from './DiceGame';
import LotteryGame from './LotteryGame';

interface CasinoHubProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

type GameType = 'menu' | 'blackjack' | 'baccarat' | 'dice' | 'lottery';

const CasinoHub = ({ user, onShowAuthDialog, onRefreshUserBalance }: CasinoHubProps) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('menu');

  const games = [
    {
      id: 'blackjack' as GameType,
      name: 'Блэкджек',
      icon: 'Spade',
      description: 'Наберите 21 очко или больше дилера',
      color: 'from-green-600 to-green-800',
      available: true
    },
    {
      id: 'baccarat' as GameType,
      name: 'Баккара',
      icon: 'Diamond',
      description: 'Классическая карточная игра казино',
      color: 'from-purple-600 to-purple-800',
      available: true
    },

    {
      id: 'dice' as GameType,
      name: 'Dice',
      icon: 'Dices',
      description: 'Бросайте кубик и угадывайте результат',
      color: 'from-orange-600 to-orange-800',
      available: true
    },
    {
      id: 'lottery' as GameType,
      name: 'Лотерея',
      icon: 'Ticket',
      description: '25 билетов по 50 USDT. Победитель получает всё',
      color: 'from-indigo-600 to-indigo-800',
      available: true
    }
  ];

  if (selectedGame === 'blackjack') {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад в казино
        </Button>
        <BlackjackGame 
          user={user} 
          onShowAuthDialog={onShowAuthDialog}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      </div>
    );
  }

  if (selectedGame === 'baccarat') {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад в казино
        </Button>
        <BaccaratGame 
          user={user} 
          onShowAuthDialog={onShowAuthDialog}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      </div>
    );
  }



  if (selectedGame === 'dice') {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад в казино
        </Button>
        <DiceGame 
          user={user} 
          onShowAuthDialog={onShowAuthDialog}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      </div>
    );
  }

  if (selectedGame === 'lottery') {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад в казино
        </Button>
        <LotteryGame 
          user={user} 
          onShowAuthDialog={onShowAuthDialog}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">🎰 Казино</h1>
        <p className="text-muted-foreground">
          Выберите игру и испытайте удачу. Играйте на реальные USDT
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <Card 
            key={game.id}
            className={`p-6 bg-gradient-to-br ${game.color} border-0 relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105 ${
              !game.available ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            onClick={() => game.available && setSelectedGame(game.id)}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Icon name={game.icon as any} size={32} className="text-white" />
                </div>
                {!game.available && (
                  <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                    <span className="text-xs font-semibold text-white">Скоро</span>
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{game.name}</h3>
              <p className="text-white/80 text-sm mb-4">{game.description}</p>

              {game.available ? (
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span>Играть</span>
                  <Icon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Icon name="Lock" size={16} />
                  <span>В разработке</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-card/50 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="Info" size={24} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Честная игра</h3>
            <p className="text-sm text-muted-foreground">
              Все игры используют проверяемый генератор случайных чисел. Каждый раунд можно проверить на честность.
              Минимальная ставка: 0.1 USDT. Выигрыши зачисляются моментально на ваш баланс.
            </p>
          </div>
        </div>
      </Card>

      {!user && (
        <Card className="p-6 bg-gradient-to-r from-green-600/20 to-green-800/20 border-green-600/30">
          <div className="flex flex-col items-center text-center gap-4">
            <Icon name="UserCircle2" size={48} className="text-green-400" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Войдите для игры</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Создайте аккаунт или войдите, чтобы начать играть на реальные USDT
              </p>
            </div>
            <Button 
              onClick={onShowAuthDialog}
              className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900"
            >
              <Icon name="LogIn" size={18} className="mr-2" />
              Войти / Регистрация
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CasinoHub;