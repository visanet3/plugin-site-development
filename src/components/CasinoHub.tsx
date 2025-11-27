import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import BlackjackGame from './BlackjackGame';
import BaccaratGame from './BaccaratGame';
import DiceGame from './DiceGame';
import LotteryGame from './LotteryGame';

import CrashGame from './CrashGame';
import MinesGame from './MinesGame';
import SlotsGame from './SlotsGame';
import PlinkoGame from './PlinkoGame';

interface CasinoHubProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

type GameType = 'menu' | 'blackjack' | 'baccarat' | 'dice' | 'lottery' | 'crash' | 'mines' | 'slots' | 'plinko';

const CasinoHub = ({ user, onShowAuthDialog, onRefreshUserBalance }: CasinoHubProps) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('menu');
  
  const canPlay = user && user.forum_role && ['member', 'verified', 'moderator', 'admin', 'vip', 'legend'].includes(user.forum_role);

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
      description: '10 билетов по 50 USDT. Приз 400 USDT',
      color: 'from-indigo-600 to-indigo-800',
      available: true
    },
    {
      id: 'crash' as GameType,
      name: 'Crash',
      icon: 'Rocket',
      description: 'Ракета взлетает - успей вывести!',
      color: 'from-sky-600 to-sky-800',
      available: true
    },
    {
      id: 'mines' as GameType,
      name: 'Mines',
      icon: 'Grid3x3',
      description: 'Найди алмазы, избегая мин',
      color: 'from-purple-600 to-purple-800',
      available: true
    },
    {
      id: 'slots' as GameType,
      name: 'Слоты',
      icon: 'Cherry',
      description: 'Классический игровой автомат',
      color: 'from-yellow-600 to-yellow-800',
      available: true
    },
    {
      id: 'plinko' as GameType,
      name: 'Plinko',
      icon: 'ArrowDown',
      description: 'Сбрось шарик и выиграй до 16x',
      color: 'from-indigo-600 to-indigo-800',
      available: true
    }
  ];

  if (selectedGame === 'blackjack') {
    return (
      <div className="space-y-4">
        <Button 
          type="button"
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад к играм
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
          type="button"
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад к играм
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
          type="button"
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад к играм
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
          type="button"
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад к играм
        </Button>
        <LotteryGame 
          user={user} 
          onShowAuthDialog={onShowAuthDialog}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      </div>
    );
  }

  if (selectedGame === 'crash') {
    return (
      <div className="space-y-4">
        <Button 
          type="button"
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад к играм
        </Button>
        <CrashGame 
          user={user} 
          onShowAuthDialog={onShowAuthDialog}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      </div>
    );
  }

  if (selectedGame === 'mines') {
    return (
      <div className="space-y-4">
        <Button 
          type="button"
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад к играм
        </Button>
        <MinesGame 
          user={user} 
          onShowAuthDialog={onShowAuthDialog}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      </div>
    );
  }

  if (selectedGame === 'slots') {
    return (
      <div className="space-y-4">
        <Button 
          type="button"
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад к играм
        </Button>
        <SlotsGame 
          user={user} 
          onShowAuthDialog={onShowAuthDialog}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      </div>
    );
  }

  if (selectedGame === 'plinko') {
    return (
      <div className="space-y-4">
        <Button 
          type="button"
          onClick={() => setSelectedGame('menu')}
          variant="outline"
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={18} />
          Назад к играм
        </Button>
        <PlinkoGame 
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
        <h1 className="text-3xl font-bold mb-2">🎮 Игры</h1>
        <p className="text-muted-foreground">
          Выберите игру и испытайте удачу. Играйте на реальные USDT. 
        </p>
        {!canPlay && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-500 mb-1">Требуется роль "Участник"</p>
                <p className="text-muted-foreground">
                  Роль "Участник" выдается автоматически через 24 часа после регистрации. Это сделано для защиты от злоупотреблений.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <Card 
            key={game.id}
            className={`p-0 bg-gradient-to-br ${game.color} border-0 relative overflow-hidden group transition-all duration-300 ${
              !game.available || !canPlay ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] hover:shadow-2xl'
            }`}
            onClick={() => {
              if (!user) {
                onShowAuthDialog();
                return;
              }
              if (!canPlay) {
                return;
              }
              if (game.available) {
                setSelectedGame(game.id);
              }
            }}
          >
            {/* Тематический фоновый паттерн */}
            <div className="absolute inset-0">
              {game.id === 'blackjack' && (
                <>
                  <div className="absolute top-4 right-8 text-white/10 text-6xl font-bold rotate-12">♠</div>
                  <div className="absolute bottom-8 left-4 text-white/10 text-5xl font-bold -rotate-12">♥</div>
                  <div className="absolute top-1/2 right-4 text-white/10 text-4xl font-bold">♦</div>
                  <div className="absolute bottom-4 right-1/3 text-white/10 text-5xl font-bold rotate-45">♣</div>
                </>
              )}
              {game.id === 'baccarat' && (
                <>
                  <div className="absolute top-6 right-6 text-white/10 text-7xl font-bold">♦</div>
                  <div className="absolute bottom-6 left-6 text-white/10 text-6xl font-bold rotate-180">♦</div>
                  <div className="absolute top-1/3 left-1/4 text-white/10 text-5xl font-bold rotate-45">♦</div>
                </>
              )}
              {game.id === 'dice' && (
                <>
                  <div className="absolute top-8 right-12 w-16 h-16 border-4 border-white/10 rounded-lg rotate-12 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-12 left-8 w-20 h-20 border-4 border-white/10 rounded-lg -rotate-12"></div>
                  <div className="absolute top-1/2 right-1/4 w-12 h-12 border-4 border-white/10 rounded-lg rotate-45"></div>
                </>
              )}
              {game.id === 'lottery' && (
                <>
                  <div className="absolute top-4 right-4 text-white/10 text-6xl">🎫</div>
                  <div className="absolute bottom-8 left-8 text-white/10 text-5xl rotate-12">🎟️</div>
                  <div className="absolute top-1/2 left-1/4 text-white/10 text-4xl -rotate-12">✨</div>
                  <div className="absolute bottom-1/3 right-1/3 text-white/10 text-5xl">🎰</div>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent"></div>
            </div>
            
            <div className="relative z-10 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <Icon name={game.icon as any} size={32} className="text-white drop-shadow-lg" />
                </div>
                {!game.available && (
                  <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                    <span className="text-xs font-semibold text-white">Скоро</span>
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">{game.name}</h3>
              <p className="text-white/90 text-sm mb-6 drop-shadow-md">{game.description}</p>

              {!game.available ? (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Icon name="Lock" size={16} />
                  <span>В разработке</span>
                </div>
              ) : !canPlay ? (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Icon name="Lock" size={16} />
                  <span>Требуется роль "Участник"</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-semibold transition-all">
                  <span>Играть</span>
                  <Icon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
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