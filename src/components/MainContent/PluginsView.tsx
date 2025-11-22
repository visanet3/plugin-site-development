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
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">
            {activeCategory === 'new' ? 'Новинки' : 
             activeCategory === 'popular' ? 'Популярное' :
             categories.find(c => c.slug === activeCategory)?.name || 'Плагины'}
          </h1>
          <p className="text-muted-foreground">
            {filteredPlugins.length} {filteredPlugins.length === 1 ? 'плагин' : 'плагинов'}
          </p>
        </div>
      )}

      {activeCategory === 'all' ? (
        <div className="max-w-4xl mx-auto space-y-8 animate-scale-in">
          <div className="relative overflow-hidden bg-gradient-to-br from-green-800/20 via-green-900/10 to-background border border-green-800/30 rounded-2xl p-8 md:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-600/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center">
                  <Icon name="GitBranch" size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    GIT CRYPTO
                  </h1>
                  <p className="text-muted-foreground">Криптовалютное сообщество</p>
                </div>
              </div>

              <p className="text-lg text-foreground/90 mb-6 leading-relaxed">
                Добро пожаловать в <span className="text-green-400 font-semibold">GIT CRYPTO</span> — сообщество энтузиастов, 
                увлечённых миром стейблкоинов и криптовалют. Сообщество создано с целью изучения информационной 
                безопасности в сфере криптовалют. Здесь мы обсуждаем всё, что связано с USDT: 
                от технических аспектов работы с различными блокчейн-сетями до практических советов 
                по безопасному хранению и использованию цифровых активов.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-xl p-4 hover:border-green-700/40 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-800/20 rounded-lg flex items-center justify-center">
                      <Icon name="MessageSquare" size={20} className="text-green-400" />
                    </div>
                    <h3 className="font-semibold">Обсуждения</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Делитесь опытом работы с USDT, задавайте вопросы и находите единомышленников
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-xl p-4 hover:border-green-700/40 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-800/20 rounded-lg flex items-center justify-center">
                      <Icon name="ShieldCheck" size={20} className="text-green-400" />
                    </div>
                    <h3 className="font-semibold">Гарант-сервис</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Наша платформа предоставляет услуги гарант-сервиса для безопасных сделок
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-xl p-4 hover:border-green-700/40 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-800/20 rounded-lg flex items-center justify-center">
                      <Icon name="Shield" size={20} className="text-green-400" />
                    </div>
                    <h3 className="font-semibold">Безопасность</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Узнайте о лучших практиках защиты ваших криптоактивов и безопасных транзакциях
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm border border-green-800/20 rounded-xl p-4 hover:border-green-700/40 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-800/20 rounded-lg flex items-center justify-center">
                      <Icon name="TrendingUp" size={20} className="text-green-400" />
                    </div>
                    <h3 className="font-semibold">Новости</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Следите за последними обновлениями, трендами и изменениями в мире криптовалют
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-800/10 border border-green-800/20 rounded-lg">
                  <Icon name="Check" size={16} className="text-green-400" />
                  <span className="text-sm">TRC20 / ERC20</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-800/10 border border-green-800/20 rounded-lg">
                  <Icon name="Check" size={16} className="text-green-400" />
                  <span className="text-sm">DeFi & Стейблкоины</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-800/10 border border-green-800/20 rounded-lg">
                  <Icon name="Check" size={16} className="text-green-400" />
                  <span className="text-sm">P2P торговля</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-800/10 border border-green-800/20 rounded-lg">
                  <Icon name="Check" size={16} className="text-green-400" />
                  <span className="text-sm">Кошельки & Биржи</span>
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