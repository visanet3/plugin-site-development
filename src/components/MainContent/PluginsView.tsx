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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-xl p-3 sm:p-4 hover:border-green-700/40 transition-all hover:scale-[1.02] hover:shadow-lg group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-800/30 to-green-700/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon name="MessageSquare" size={18} className="text-green-400 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold mb-1 text-green-400">Форум</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        Активное сообщество для обсуждения криптовалют, обмена опытом и советами по работе с USDT
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-green-500/80">
                    <Icon name="Users" size={12} />
                    <span>Открытые обсуждения</span>
                  </div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-cyan-800/20 rounded-xl p-3 sm:p-4 hover:border-cyan-700/40 transition-all hover:scale-[1.02] hover:shadow-lg group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-800/30 to-cyan-700/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon name="Gamepad2" size={18} className="text-cyan-400 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold mb-1 text-cyan-400">Казино</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        Играйте в Crash, Mines, Roulette и участвуйте в лотереях с реальными выигрышами в USDT
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-cyan-500/80">
                    <Icon name="Dices" size={12} />
                    <span>4 игры доступно</span>
                  </div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-blue-800/20 rounded-xl p-3 sm:p-4 hover:border-blue-700/40 transition-all hover:scale-[1.02] hover:shadow-lg group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-800/30 to-blue-700/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon name="Mail" size={18} className="text-blue-400 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold mb-1 text-blue-400">Сообщения</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        Личные сообщения между пользователями для приватного общения и сделок
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-blue-500/80">
                    <Icon name="Lock" size={12} />
                    <span>Приватные чаты</span>
                  </div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-purple-800/20 rounded-xl p-3 sm:p-4 hover:border-purple-700/40 transition-all hover:scale-[1.02] hover:shadow-lg group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-800/30 to-purple-700/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon name="Bell" size={18} className="text-purple-400 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold mb-1 text-purple-400">Уведомления</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        Мгновенные оповещения о новых сообщениях, комментариях и активности на форуме
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-purple-500/80">
                    <Icon name="Zap" size={12} />
                    <span>Real-time уведомления</span>
                  </div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-orange-800/20 rounded-xl p-3 sm:p-4 hover:border-orange-700/40 transition-all hover:scale-[1.02] hover:shadow-lg group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-800/30 to-orange-700/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon name="Shield" size={18} className="text-orange-400 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold mb-1 text-orange-400">Безопасность</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        Защита аккаунтов, безопасные транзакции и система рангов для проверенных пользователей
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-orange-500/80">
                    <Icon name="ShieldCheck" size={12} />
                    <span>Система рангов</span>
                  </div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-teal-800/20 rounded-xl p-3 sm:p-4 hover:border-teal-700/40 transition-all hover:scale-[1.02] hover:shadow-lg group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-800/30 to-teal-700/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon name="Wallet" size={18} className="text-teal-400 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-bold mb-1 text-teal-400">Баланс USDT</h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        Внутренний баланс для игр в казино, ставок и участия в лотереях с историей транзакций
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-teal-500/80">
                    <Icon name="TrendingUp" size={12} />
                    <span>Пополнение и вывод</span>
                  </div>
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