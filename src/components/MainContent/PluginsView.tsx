import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Plugin, Category } from '@/types';
import { useState, useEffect } from 'react';

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
  const isHomePage = activeCategory === 'all';
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const filteredPlugins = plugins.filter(p => 
    activeCategory === 'all' || p.category_name === categories.find(c => c.slug === activeCategory)?.name
  );

  const features = [
    {
      icon: 'MessageSquare',
      title: 'Форум криптосообщества',
      description: 'Обсуждайте криптовалюты, технологии блокчейн и получайте экспертные советы от активного сообщества.',
      items: ['Тематические разделы', 'Система рейтингов', 'Модерация 24/7', 'Приватные группы'],
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      bgGradient: 'from-emerald-500/10 via-teal-500/5 to-cyan-500/10'
    },
    {
      icon: 'Zap',
      title: 'Flash USDT TRC20',
      description: 'Мгновенная покупка Flash USDT токенов с поддержкой всех популярных блокчейн-сетей.',
      items: ['TRC20, ERC20, BEP20', 'Моментальная доставка', 'Скидки до 99%', 'API для разработчиков'],
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      bgGradient: 'from-amber-500/10 via-orange-500/5 to-yellow-500/10'
    },
    {
      icon: 'ShieldCheck',
      title: 'Гарант-сервис',
      description: 'Безопасные P2P сделки с криптовалютой через эскроу-механизм и систему арбитража.',
      items: ['Защита от мошенников', 'Умное эскроу', 'Рейтинг доверия', 'Автоматический арбитраж'],
      gradient: 'from-blue-500 via-indigo-500 to-violet-500',
      bgGradient: 'from-blue-500/10 via-indigo-500/5 to-violet-500/10'
    },
    {
      icon: 'ArrowLeftRight',
      title: 'Обменник криптовалют',
      description: 'Быстрый обмен между сетями и криптовалютами по выгодным курсам без скрытых комиссий.',
      items: ['Конвертация между сетями', 'Минимальные комиссии', 'API интеграция', 'История операций'],
      gradient: 'from-teal-500 via-emerald-500 to-green-500',
      bgGradient: 'from-teal-500/10 via-emerald-500/5 to-green-500/10'
    },
    {
      icon: 'FileCode',
      title: 'Смарт-контракты',
      description: 'Создание, аудит и деплой смарт-контрактов с готовыми шаблонами для TRON, Ethereum.',
      items: ['Готовые шаблоны', 'Автоматический аудит', 'Деплой в один клик', 'Техподдержка'],
      gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
      bgGradient: 'from-indigo-500/10 via-blue-500/5 to-cyan-500/10'
    },
    {
      icon: 'Gift',
      title: 'Реферальная программа',
      description: 'Зарабатывайте на приглашениях друзей — до 20% от их активности на платформе навсегда.',
      items: ['До 20% с рефералов', 'Многоуровневая система', 'Статистика в реальном времени', 'Моментальный вывод'],
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
      bgGradient: 'from-orange-500/10 via-amber-500/5 to-yellow-500/10'
    }
  ];

  const stats = [
    { icon: 'Users', value: '5,247', label: 'Активных пользователей', color: 'text-emerald-400' },
    { icon: 'MessageSquare', value: '12,854', label: 'Обсуждений на форуме', color: 'text-cyan-400' },
    { icon: 'Coins', value: '₮2.4M', label: 'Объём транзакций', color: 'text-amber-400' },
    { icon: 'TrendingUp', value: '99.9%', label: 'Время работы', color: 'text-teal-400' }
  ];

  const benefits = [
    { icon: 'ShieldCheck', text: 'Безопасность транзакций', color: 'from-blue-500 to-cyan-500' },
    { icon: 'Zap', text: 'Мгновенные переводы', color: 'from-amber-500 to-orange-500' },
    { icon: 'Lock', text: 'Полная анонимность', color: 'from-violet-500 to-purple-500' },
    { icon: 'Headphones', text: 'Поддержка 24/7', color: 'from-emerald-500 to-teal-500' }
  ];

  return (
    <div className="relative min-h-screen">
      {activeCategory !== 'all' && (
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">
            {categories.find(c => c.slug === activeCategory)?.name || 'Плагины'}
          </h1>
          <p className="text-muted-foreground">
            {filteredPlugins.length} {filteredPlugins.length === 1 ? 'плагин' : 'плагинов'}
          </p>
        </div>
      )}

      {activeCategory === 'all' ? (
        <div className="w-full max-w-7xl mx-auto space-y-16 pb-16">
          <div 
            className="relative overflow-hidden rounded-3xl"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent)]"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10 px-6 py-16 md:px-12 md:py-24">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-400">Платформа №1 для Flash USDT</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    GIT CRYPTO
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
                  Криптовалютная экосистема с форумом, магазином Flash токенов и безопасными P2P сделками
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/20"
                  >
                    <Icon name="Zap" className="mr-2" />
                    Купить Flash USDT
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={onNavigateToForum}
                    className="border-emerald-500/30 hover:bg-emerald-500/10 px-8 py-6 text-lg rounded-xl"
                  >
                    <Icon name="MessageSquare" className="mr-2" />
                    Перейти на форум
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:scale-105 transition-transform"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${benefit.color} flex items-center justify-center`}>
                        <Icon name={benefit.icon} size={20} className="text-white" />
                      </div>
                      <span className="text-xs text-center font-medium">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={index}
                className="relative overflow-hidden group hover:scale-105 transition-all duration-300 cursor-pointer border-border/50 backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-6 text-center space-y-2">
                  <Icon name={stat.icon} className={`${stat.color} mx-auto mb-2`} size={32} />
                  <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Возможности платформы
              </h2>
              <p className="text-muted-foreground text-lg">
                Всё необходимое для работы с криптовалютами в одном месте
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="group relative overflow-hidden border-border/50 hover:border-emerald-500/30 transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative p-8 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon name={feature.icon} className="text-white" size={28} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {feature.items.map((item, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-2 text-xs text-foreground/70 group-hover:text-foreground/90 transition-colors"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.gradient}`}></div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.15),transparent)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(6,182,212,0.15),transparent)]"></div>
            
            <div className="relative z-10 text-center space-y-6 max-w-3xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl">
                <Icon name="Rocket" className="text-white" size={32} />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black">
                Готовы начать работу с Flash USDT?
              </h2>
              
              <p className="text-lg text-foreground/70">
                Присоединяйтесь к тысячам пользователей, которые уже используют нашу платформу для безопасных криптовалютных операций
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-10 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  <Icon name="Zap" className="mr-2" />
                  Начать сейчас
                </Button>
                <Button 
                  size="lg"
                  variant="ghost"
                  className="px-10 py-6 text-lg rounded-xl hover:bg-emerald-500/10"
                >
                  <Icon name="BookOpen" className="mr-2" />
                  Узнать больше
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
          {filteredPlugins.map((plugin: Plugin) => (
            <Card key={plugin.id} className="group overflow-hidden border-border hover:border-emerald-500/30 transition-all hover:scale-105 cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                <Icon name="Package" size={48} className="text-emerald-500/50" />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-lg line-clamp-1">{plugin.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{plugin.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{plugin.downloads} загрузок</span>
                  <span className="text-xs font-medium text-emerald-400">⭐ {plugin.rating}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
