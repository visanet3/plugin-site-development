import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

const NEWS_URL = 'https://functions.poehali.dev/9bca6c4a-beb3-47f6-9994-730c638282aa';

interface NewsItem {
  id: string;
  title: string;
  body: string;
  url: string;
  imageurl: string;
  published_at: number;
  source: string;
  source_info: {
    name: string;
    img: string;
    lang: string;
  };
  categories: string[];
  lang: string;
}

export const CryptoNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(NEWS_URL);
      const data = await response.json();
      
      if (data.success && data.news) {
        setNews(data.news);
      } else {
        setError('Не удалось загрузить новости');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;

    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'CRYPTOCURRENCY': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'BLOCKCHAIN': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      'EXCHANGE': 'bg-green-500/20 text-green-400 border-green-500/50',
      'REGULATION': 'bg-red-500/20 text-red-400 border-red-500/50',
      'MARKET': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'ICO': 'bg-pink-500/20 text-pink-400 border-pink-500/50',
      'MINING': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      'WALLET': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      'TRADING': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'CRYPTOCURRENCY': 'Bitcoin',
      'BLOCKCHAIN': 'Link',
      'EXCHANGE': 'ArrowLeftRight',
      'REGULATION': 'Scale',
      'MARKET': 'TrendingUp',
      'ICO': 'Rocket',
      'MINING': 'Pickaxe',
      'WALLET': 'Wallet',
      'TRADING': 'BarChart3'
    };
    return icons[category] || 'FileText';
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 mb-4">
          <Icon name="Newspaper" size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3">Новости криптовалют</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Актуальные новости из мира криптовалют и блокчейна в реальном времени
        </p>
      </div>

      <Card className="p-5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
            <Icon name="Rss" size={24} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold mb-1">Автоматическое обновление</p>
            <p className="text-sm text-muted-foreground">
              Новости обновляются автоматически каждые 10 минут из проверенных источников
            </p>
          </div>
          <Button 
            onClick={fetchNews} 
            variant="outline" 
            size="sm"
            disabled={loading}
            className="shrink-0"
          >
            <Icon name={loading ? "Loader2" : "RefreshCw"} size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-5 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-3">
            <Icon name="AlertCircle" size={24} className="text-red-400" />
            <div>
              <p className="font-semibold text-red-400">Ошибка загрузки</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {loading && news.length === 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/10"
              onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
            >
              {item.imageurl && (
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={item.imageurl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>

                {item.body && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.body}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {item.categories.slice(0, 2).map((category, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={`text-xs ${getCategoryColor(category)}`}
                    >
                      <Icon name={getCategoryIcon(category) as any} size={10} className="mr-1" />
                      {category}
                    </Badge>
                  ))}
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.source_info?.img && (
                      <img
                        src={item.source_info.img}
                        alt={item.source_info.name}
                        className="w-5 h-5 rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {item.source_info?.name || item.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Icon name="Clock" size={12} />
                    {formatDate(item.published_at)}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full group-hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Icon name="ExternalLink" size={14} className="mr-2" />
                  Читать полностью
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && news.length === 0 && !error && (
        <Card className="p-12 text-center">
          <Icon name="Newspaper" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Новости временно недоступны
          </p>
        </Card>
      )}

      <Card className="p-6 bg-gradient-to-r from-primary/5 via-blue-500/5 to-cyan-500/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon name="Info" size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">Источник новостей</h3>
            <p className="text-muted-foreground mb-3">
              Новости предоставлены CryptoCompare API — агрегатором проверенных источников криптовалютной индустрии.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <Icon name="Shield" size={10} className="mr-1" />
                Проверенные источники
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Icon name="Zap" size={10} className="mr-1" />
                Обновление в реальном времени
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Icon name="Globe" size={10} className="mr-1" />
                Мировые новости
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CryptoNews;
