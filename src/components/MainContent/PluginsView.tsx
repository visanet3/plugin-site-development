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
        <div className="mb-4 sm:mb-6 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {activeCategory === 'new' ? 'Новинки' : 
             activeCategory === 'popular' ? 'Популярное' :
             categories.find(c => c.slug === activeCategory)?.name || 'Плагины'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {filteredPlugins.length} {filteredPlugins.length === 1 ? 'плагин' : 'плагинов'}
          </p>
        </div>
      )}

      {activeCategory === 'all' ? (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 animate-scale-in px-2 sm:px-0">
          <div className="relative overflow-hidden bg-gradient-to-br from-green-800/20 via-teal-800/10 to-cyan-900/10 border border-green-500/30 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-gradient-to-tr from-teal-500/10 to-green-600/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
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

              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-foreground/90 mb-3 sm:mb-4 md:mb-6 leading-relaxed">
                Добро пожаловать в <span className="bg-gradient-to-r from-green-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent font-bold">GIT CRYPTO</span> — сообщество энтузиастов, 
                увлечённых миром стейблкоинов и криптовалют. Сообщество создано с целью изучения информационной 
                безопасности в сфере криптовалют. Здесь мы обсуждаем всё, что связано с USDT: 
                от технических аспектов работы с различными блокчейн-сетями до практических советов 
                по безопасному хранению и использованию цифровых активов.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 hover:border-green-700/40 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-green-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="MessageSquare" size={14} className="text-green-400 sm:w-[15px] sm:h-[15px] md:w-4 md:h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold">Обсуждения</h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground leading-snug">
                    Делитесь опытом работы с USDT, задавайте вопросы и находите единомышленников
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 hover:border-green-700/40 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-green-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="ShieldCheck" size={14} className="text-green-400 sm:w-[15px] sm:h-[15px] md:w-4 md:h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold">Гарант-сервис</h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground leading-snug">
                    Наша платформа предоставляет услуги гарант-сервиса для безопасных сделок
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 hover:border-green-700/40 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-green-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="Shield" size={14} className="text-green-400 sm:w-[15px] sm:h-[15px] md:w-4 md:h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold">Безопасность</h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground leading-snug">
                    Узнайте о лучших практиках защиты ваших криптоактивов и безопасных транзакциях
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 hover:border-green-700/40 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-green-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="TrendingUp" size={14} className="text-green-400 sm:w-[15px] sm:h-[15px] md:w-4 md:h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold">Новости</h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground leading-snug">
                    Следите за последними обновлениями, трендами и изменениями в мире криптовалют
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-green-800/10 border border-green-800/20 rounded-lg">
                  <Icon name="Check" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">TRC20 / ERC20</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-green-800/10 border border-green-800/20 rounded-lg">
                  <Icon name="Check" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">DeFi & Стейблкоины</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-green-800/10 border border-green-800/20 rounded-lg">
                  <Icon name="Check" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">P2P торговля</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-green-800/10 border border-green-800/20 rounded-lg">
                  <Icon name="Check" size={14} className="text-green-400 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Кошельки & Биржи</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card/50 border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="Compass" size={24} className="text-primary" />
              Начните с форума
            </h2>
            <p className="text-muted-foreground mb-4">
              Перейдите в раздел <span className="text-green-400 font-medium">Форум</span> в боковом меню, 
              чтобы присоединиться к обсуждениям, задать вопросы или поделиться своим опытом работы с USDT и другими криптовалютами.
            </p>
            <Button 
              onClick={onNavigateToForum}
              className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
            >
              <Icon name="MessageSquare" size={18} className="mr-2" />
              Перейти к форуму
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortPlugins('newest').map((plugin, index) => (
            <div
              key={plugin.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${plugin.gradient_from}, ${plugin.gradient_to})`
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {plugin.status === 'premium' && (
                          <Badge variant="default" className="bg-primary">
                            СБОРКА
                          </Badge>
                        )}
                        {plugin.status === 'new' && (
                          <Badge variant="secondary" className="bg-accent">
                            НОВЫЙ
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                        {plugin.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {plugin.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Icon name="Download" size={14} />
                        <span>{plugin.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Star" size={14} className="text-yellow-500 fill-yellow-500" />
                        <span>{plugin.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        <span>{new Date(plugin.created_at).toLocaleDateString('ru')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {plugin.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};