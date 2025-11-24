import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface WinEntry {
  id: string;
  username: string;
  avatar_url?: string;
  amount: number;
  game: string;
  timestamp: Date;
}

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

const RecentWinsFeed = () => {
  const [wins, setWins] = useState<WinEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentWins();
    const interval = setInterval(fetchRecentWins, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentWins = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_recent_wins',
          limit: 15
        })
      });

      const data = await response.json();
      if (data.success && data.wins) {
        setWins(data.wins.map((win: any) => ({
          ...win,
          amount: parseFloat(win.amount),
          timestamp: new Date(win.created_at)
        })));
      }
    } catch (error) {
      console.error('Ошибка загрузки выигрышей:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGameIcon = (game: string) => {
    const icons: Record<string, string> = {
      'dice': 'Dices',
      'roulette': 'CircleDot',
      'blackjack': 'Spade',
      'baccarat': 'Diamond',
      'lottery': 'Ticket'
    };
    return icons[game.toLowerCase()] || 'Trophy';
  };

  const getGameColor = (game: string) => {
    const colors: Record<string, string> = {
      'dice': 'text-orange-400',
      'roulette': 'text-green-400',
      'blackjack': 'text-green-400',
      'baccarat': 'text-purple-400',
      'lottery': 'text-indigo-400'
    };
    return colors[game.toLowerCase()] || 'text-yellow-400';
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    return `${Math.floor(seconds / 86400)} д назад`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Icon name="Trophy" size={14} className="text-yellow-400" />
          </div>
          <h3 className="text-sm font-semibold">Последние выигрыши</h3>
        </div>
        <Card className="p-4 bg-gradient-to-br from-yellow-950/20 via-yellow-900/10 to-orange-950/20 border-yellow-800/20">
          <div className="flex items-center justify-center h-20">
            <Icon name="Loader2" size={24} className="animate-spin text-yellow-400" />
          </div>
        </Card>
      </div>
    );
  }

  if (wins.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Icon name="Trophy" size={14} className="text-yellow-400" />
          </div>
          <h3 className="text-sm font-semibold">Последние выигрыши</h3>
        </div>
        <Card className="p-4 bg-gradient-to-br from-yellow-950/20 via-yellow-900/10 to-orange-950/20 border-yellow-800/20">
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-muted-foreground">Будьте первым!</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <Icon name="Trophy" size={14} className="text-yellow-400" />
        </div>
        <h3 className="text-sm font-semibold">Последние выигрыши</h3>
      </div>
      
      <Card className="p-4 bg-gradient-to-br from-yellow-950/20 via-yellow-900/10 to-orange-950/20 border-yellow-800/20 overflow-hidden relative">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {wins.slice(0, 15).map((win) => (
            <div
              key={win.id}
              className="flex flex-col items-center gap-2 group flex-shrink-0"
            >
              <div className="relative">
                {win.avatar_url ? (
                  <img
                    src={win.avatar_url}
                    alt={win.username}
                    className="w-14 h-14 rounded-full border-2 border-yellow-500/30 transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-full flex items-center justify-center border-2 border-yellow-500/30 transition-transform group-hover:scale-110">
                    <Icon name="User" size={24} className="text-yellow-400" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center border border-yellow-500/50">
                  <Icon name={getGameIcon(win.game)} size={12} className={getGameColor(win.game)} />
                </div>
              </div>
              
              <div className="text-center">
                <div className="font-semibold text-yellow-400 text-sm">+{win.amount.toFixed(0)}</div>
                <div className="text-muted-foreground text-[10px]">{win.username}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-yellow-950/60 via-yellow-950/30 to-transparent pointer-events-none"></div>
      </Card>
    </div>
  );
};

export default RecentWinsFeed;