import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import BlackjackGame from './BlackjackGame';
import BaccaratGame from './BaccaratGame';
import DiceGame from './DiceGame';
import LotteryGame from './LotteryGame';


import MinesGame from './MinesGame';
import SlotsGame from './SlotsGame';

interface CasinoHubProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

type GameType = 'menu' | 'blackjack' | 'baccarat' | 'dice' | 'lottery' | 'mines' | 'slots';

const CasinoHub = ({ user, onShowAuthDialog, onRefreshUserBalance }: CasinoHubProps) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('menu');
  
  const canPlay = user && user.forum_role && ['member', 'verified', 'moderator', 'admin', 'vip', 'legend'].includes(user.forum_role);

  const games = [
    {
      id: 'blackjack' as GameType,
      name: 'Блэкджек',
      icon: 'Spade',
      description: 'Наберите 21 очко или больше дилера',
      color: 'from-emerald-600 via-green-600 to-teal-700',
      available: true
    },
    {
      id: 'baccarat' as GameType,
      name: 'Баккара',
      icon: 'Diamond',
      description: 'Классическая карточная игра казино',
      color: 'from-purple-600 via-violet-600 to-indigo-700',
      available: true
    },
    {
      id: 'dice' as GameType,
      name: 'Dice',
      icon: 'Dices',
      description: 'Бросайте кубик и угадывайте результат',
      color: 'from-orange-600 via-red-600 to-pink-700',
      available: true
    },
    {
      id: 'lottery' as GameType,
      name: 'Лотерея',
      icon: 'Ticket',
      description: '10 билетов по 50 USDT. Приз 400 USDT',
      color: 'from-indigo-600 via-blue-600 to-cyan-700',
      available: true
    },

    {
      id: 'mines' as GameType,
      name: 'Mines',
      icon: 'Grid3x3',
      description: 'Найди алмазы, избегая мин',
      color: 'from-violet-600 via-purple-600 to-fuchsia-700',
      available: true
    },
    {
      id: 'slots' as GameType,
      name: 'Слоты',
      icon: 'Cherry',
      description: 'Классический игровой автомат',
      color: 'from-amber-600 via-yellow-600 to-orange-700',
      available: true
    },

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



  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 blur-3xl -z-10"></div>
        <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          🎮 Казино
        </h1>
        <p className="text-lg text-muted-foreground">
          Премиум игры на реальные USDT с мгновенными выплатами
        </p>
        {!canPlay && (
          <div className="mt-6 p-5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="Info" size={20} className="text-yellow-400" />
              </div>
              <div className="text-sm">
                <p className="font-bold text-yellow-400 mb-2 text-base">Требуется роль "Участник"</p>
                <p className="text-muted-foreground">
                  Роль выдается автоматически через 24 часа после регистрации для защиты от злоупотреблений.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {games.map((game) => (
          <Card 
            key={game.id}
            className={`group relative p-0 bg-gradient-to-br ${game.color} border-0 overflow-hidden transition-all duration-500 ${
              !game.available || !canPlay 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:scale-[1.05] hover:shadow-[0_20px_60px_-15px] hover:shadow-current/50 hover:-translate-y-1'
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
            
            <div className="absolute inset-0 opacity-20">
              {game.id === 'blackjack' && (
                <>
                  <div className="absolute top-4 right-6 text-white/30 text-5xl font-bold rotate-12 group-hover:rotate-45 transition-transform duration-700">♠</div>
                  <div className="absolute bottom-6 left-4 text-white/30 text-4xl font-bold -rotate-12 group-hover:-rotate-45 transition-transform duration-700">♥</div>
                </>
              )}
              {game.id === 'crash' && (
                <div className="absolute top-1/2 right-6 text-white/30 text-6xl group-hover:translate-y-[-20px] transition-transform duration-700">🚀</div>
              )}
              {game.id === 'mines' && (
                <div className="absolute bottom-4 right-4 text-white/30 text-5xl">💎</div>
              )}
              {game.id === 'slots' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-7xl group-hover:rotate-180 transition-transform duration-1000">🎰</div>
              )}
            </div>
            
            <div className="relative z-10 p-7">
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 bg-white/25 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-xl ring-1 ring-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Icon name={game.icon as any} size={28} className="text-white drop-shadow-2xl" />
                </div>
                {!game.available && (
                  <div className="px-3 py-1.5 bg-white/25 rounded-xl backdrop-blur-md ring-1 ring-white/30">
                    <span className="text-xs font-bold text-white tracking-wide">СКОРО</span>
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-black text-white mb-2 drop-shadow-2xl tracking-tight">{game.name}</h3>
              <p className="text-white/80 text-sm mb-6 drop-shadow-lg leading-relaxed">{game.description}</p>

              {!game.available ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 rounded-xl text-white/70 text-sm font-semibold backdrop-blur-sm">
                  <Icon name="Lock" size={16} />
                  <span>В разработке</span>
                </div>
              ) : !canPlay ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 rounded-xl text-white/70 text-sm font-semibold backdrop-blur-sm">
                  <Icon name="Lock" size={16} />
                  <span>Нужна роль</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/30 hover:bg-white/40 backdrop-blur-md rounded-xl text-white font-bold transition-all shadow-lg ring-1 ring-white/40 group-hover:ring-white/60">
                  <span>Играть</span>
                  <Icon name="Play" size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border-blue-500/20 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-blue-400/30">
              <Icon name="Shield" size={24} className="text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-blue-300">Честная игра</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Проверяемый генератор случайных чисел. Мгновенные выплаты на баланс.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-600/10 to-emerald-600/10 border-green-500/20 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-green-400/30">
              <Icon name="Zap" size={24} className="text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-green-300">Мгновенно</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Минимальная ставка 0.1 USDT. Выигрыши зачисляются моментально.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {!user && (
        <Card className="p-8 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 border-purple-500/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.15),transparent)]"></div>
          <div className="relative flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-purple-400/20">
              <Icon name="UserCircle2" size={40} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-2xl mb-2 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Начните играть
              </h3>
              <p className="text-muted-foreground">
                Войдите или создайте аккаунт для игры на реальные USDT
              </p>
            </div>
            <Button 
              onClick={onShowAuthDialog}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 px-8 py-6 text-lg font-bold"
            >
              <Icon name="LogIn" size={20} className="mr-2" />
              Войти
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CasinoHub;