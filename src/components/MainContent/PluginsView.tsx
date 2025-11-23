import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Plugin, Category } from '@/types';

interface PluginsViewProps {
  activeCategory: string;
  plugins: Plugin[];
  categories: Category[];
  onNavigateToForum?: () => void;
}

export const PluginsView = ({
  activeCategory,
  plugins,
  categories,
  onNavigateToForum
}: PluginsViewProps) => {
  const filteredPlugins = plugins.filter(p => 
    activeCategory === 'all' || p.category_name === categories.find(c => c.slug === activeCategory)?.name
  );

  const sortPlugins = (sortBy: string) => {
    const sorted = [...filteredPlugins];
    if (sortBy === 'newest') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortBy === 'popular') sorted.sort((a, b) => b.downloads - a.downloads);
    if (sortBy === 'rating') sorted.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    return sorted;
  };

  return (
    <>
      {activeCategory !== 'all' && (
        <div className="mb-3 sm:mb-4 md:mb-6 animate-slide-up">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
            {activeCategory === 'new' ? 'Новинки' : 
             activeCategory === 'popular' ? 'Популярное' :
             categories.find(c => c.slug === activeCategory)?.name || 'Плагины'}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            {filteredPlugins.length} {filteredPlugins.length === 1 ? 'плагин' : 'плагинов'}
          </p>
        </div>
      )}

      {activeCategory === 'all' ? (
        <div className="w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 animate-scale-in">
          {/* Hero секция */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-800/20 via-teal-800/10 to-cyan-900/10 border border-green-500/30 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 bg-gradient-to-tr from-teal-500/10 to-green-600/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              {/* Заголовок */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 via-teal-500 to-cyan-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Icon name="GitBranch" size={20} className="text-white sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent leading-tight">
                    GIT CRYPTO
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Криптовалютное сообщество</p>
                </div>
              </div>

              {/* Описание */}
              <p className="text-xs sm:text-sm md:text-base text-foreground/90 mb-3 sm:mb-4 md:mb-5 leading-relaxed">
                Добро пожаловать в <span className="bg-gradient-to-r from-green-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent font-bold">GIT CRYPTO</span> — сообщество энтузиастов, 
                увлечённых миром стейблкоинов и криптовалют. Сообщество создано с целью изучения информационной 
                безопасности в сфере криптовалют. Здесь мы обсуждаем всё, что связано с USDT: 
                от технических аспектов работы с различными блокчейн-сетями до практических советов 
                по безопасному хранению и использованию цифровых активов.
              </p>

              {/* Карточки возможностей */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-lg p-2.5 sm:p-3 hover:border-green-700/40 transition-all hover:scale-[1.02]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="MessageSquare" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold">Обсуждения</h3>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
                    Делитесь опытом работы с USDT, задавайте вопросы и находите единомышленников
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-lg p-2.5 sm:p-3 hover:border-green-700/40 transition-all hover:scale-[1.02]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="ShieldCheck" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold">Гарант-сервис</h3>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
                    Наша платформа предоставляет услуги гарант-сервиса для безопасных сделок
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-lg p-2.5 sm:p-3 hover:border-green-700/40 transition-all hover:scale-[1.02]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="Shield" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold">Безопасность</h3>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
                    Узнайте о лучших практиках защиты ваших криптоактивов и безопасных транзакциях
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-lg p-2.5 sm:p-3 hover:border-green-700/40 transition-all hover:scale-[1.02]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="TrendingUp" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold">Новости</h3>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
                    Следите за последними обновлениями, трендами и изменениями в мире криптовалют
                  </p>
                </div>
              </div>

              {/* Теги */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-green-800/10 border border-green-800/20 rounded-md">
                  <Icon name="Check" size={12} className="text-green-400" />
                  <span className="text-[10px] sm:text-xs">TRC20 / ERC20</span>
                </div>
                <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-green-800/10 border border-green-800/20 rounded-md">
                  <Icon name="Check" size={12} className="text-green-400" />
                  <span className="text-[10px] sm:text-xs">DeFi & Стейблкоины</span>
                </div>
                <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-green-800/10 border border-green-800/20 rounded-md">
                  <Icon name="Check" size={12} className="text-green-400" />
                  <span className="text-[10px] sm:text-xs">P2P торговля</span>
                </div>
                <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-green-800/10 border border-green-800/20 rounded-md">
                  <Icon name="Check" size={12} className="text-green-400" />
                  <span className="text-[10px] sm:text-xs">Безопасное хранение</span>
                </div>
              </div>

              {/* Кнопка */}
              <Button
                onClick={onNavigateToForum}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 hover:from-green-700 hover:via-teal-700 hover:to-cyan-700 shadow-lg shadow-green-800/30 text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-6"
              >
                <Icon name="MessageSquare" size={16} className="mr-1.5 sm:w-[18px] sm:h-[18px]" />
                Перейти на форум
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {sortPlugins('newest').map((plugin) => (
            <div
              key={plugin.id}
              className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer animate-fade-in"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  {plugin.category_name}
                </Badge>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2">
                {plugin.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                {plugin.description}
              </p>
              <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Icon name="Download" size={12} className="sm:w-[14px] sm:h-[14px]" />
                  <span>{plugin.downloads}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="Star" size={12} className="sm:w-[14px] sm:h-[14px] text-yellow-500" />
                  <span>{plugin.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
