import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  const features = [
    {
      icon: 'MessageSquare',
      title: 'Форум',
      description: 'Обсуждения криптовалют, новостей и технологий. Общайтесь с участниками сообщества.',
      items: ['Категории по темам', 'Создание тем и ответов', 'Система рангов', 'Поиск по форуму']
    },
    {
      icon: 'Zap',
      title: 'Flash USDT',
      description: 'Покупка и продажа Flash USDT для всех популярных блокчейн-сетей.',
      items: ['TRC20, ERC20, BEP20', 'Актуальные курсы', 'Быстрые операции', 'История покупок']
    },
    {
      icon: 'Gamepad2',
      title: 'Игры',
      description: 'Казино с честными алгоритмами. Crash, Mines, Roulette, Lottery.',
      items: ['Provably Fair система', 'Ставки в USDT', 'Мгновенные выплаты', 'Статистика игр']
    },
    {
      icon: 'ShieldCheck',
      title: 'Гарант-сервис',
      description: 'Безопасные сделки с защитой от мошенничества через эскроу-систему.',
      items: ['Создание сделок', 'Эскроу-механизм', 'Арбитраж споров', 'Рейтинг участников']
    },
    {
      icon: 'ArrowLeftRight',
      title: 'Обменник',
      description: 'Обмен криптовалют и конвертация между блокчейн-сетями.',
      items: ['Обмен USDT', 'Актуальные курсы', 'Низкие комиссии', 'Быстрые переводы']
    },
    {
      icon: 'FileCode',
      title: 'Смарт-контракты',
      description: 'Создание, аудит и деплой смарт-контрактов в блокчейн.',
      items: ['Шаблоны контрактов', 'Проверка безопасности', 'Деплой в сеть', 'Документация']
    },
    {
      icon: 'Mail',
      title: 'Сообщения',
      description: 'Личные сообщения между пользователями для приватного общения.',
      items: ['Приватные чаты', 'Отправка файлов', 'Push-уведомления', 'История переписки']
    },
    {
      icon: 'Gift',
      title: 'Реферальная программа',
      description: 'Приглашайте друзей и получайте процент с их активности.',
      items: ['Уникальная ссылка', 'Комиссия с рефералов', 'Статистика', 'Вывод средств']
    },
    {
      icon: 'Wallet',
      title: 'Баланс',
      description: 'Управление средствами на платформе. Пополнение и вывод.',
      items: ['Пополнение', 'Вывод', 'История операций', 'Безопасное хранение']
    },
    {
      icon: 'HelpCircle',
      title: 'Поддержка',
      description: 'Техническая поддержка 24/7 через систему тикетов.',
      items: ['Создание заявок', 'Быстрые ответы', 'База знаний', 'История обращений']
    }
  ];

  const stats = [
    { icon: 'Users', value: '5000+', label: 'Активных пользователей' },
    { icon: 'MessageSquare', value: '10000+', label: 'Обсуждений на форуме' },
    { icon: 'Coins', value: '₮1M+', label: 'Объём транзакций' },
    { icon: 'TrendingUp', value: '99.9%', label: 'Время работы' }
  ];

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
        <div className="w-full max-w-6xl mx-auto space-y-8 animate-scale-in pb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name="GitBranch" className="text-primary w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-black mb-2 text-foreground">
                  GIT CRYPTO
                </h1>
                <p className="text-base md:text-lg text-muted-foreground">
                  Криптовалютное сообщество и платформа для работы с USDT
                </p>
              </div>
            </div>

            <p className="text-sm md:text-base text-foreground/80 leading-relaxed mb-6">
              Git Crypto — сообщество для обсуждения криптовалют и изучения информационной безопасности в сфере стейблкоинов. 
              Платформа предоставляет инструменты для общения, сделок и работы с цифровыми активами.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-zinc-900/80 border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">5000+</div>
                <div className="text-xs text-muted-foreground">Пользователей</div>
              </Card>
              <Card className="bg-zinc-900/80 border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">10K+</div>
                <div className="text-xs text-muted-foreground">Обсуждений</div>
              </Card>
              <Card className="bg-zinc-900/80 border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">₮1M+</div>
                <div className="text-xs text-muted-foreground">Транзакций</div>
              </Card>
              <Card className="bg-zinc-900/80 border-zinc-800 p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">99.9%</div>
                <div className="text-xs text-muted-foreground">Аптайм</div>
              </Card>
            </div>
          </div>

          <div>
            <div className="mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
                Возможности платформы
              </h2>
              <p className="text-sm text-muted-foreground">
                Основные функции и сервисы
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="bg-zinc-900/50 border-zinc-800 p-5 md:p-6 hover:bg-zinc-900/70 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name={feature.icon as any} className="text-primary w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold mb-1 text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pt-3 border-t border-zinc-800">
                    {feature.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-foreground/70">
                        <div className="w-1 h-1 rounded-full bg-primary/50"></div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-zinc-900/50 border-zinc-800 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <Icon name="Shield" className="w-12 h-12 text-primary flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 text-foreground">Безопасность</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Платформа использует современные протоколы защиты данных и финансовых операций. 
                  Эскроу-система, шифрование, мониторинг безопасности 24/7.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <Icon name="Lock" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/70">Шифрование данных и транзакций</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="ShieldCheck" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/70">Защита сделок через эскроу</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="Eye" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/70">Мониторинг активности 24/7</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="UserCheck" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/70">Система рейтингов пользователей</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
              Начать работу
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
              Присоединяйтесь к сообществу, участвуйте в обсуждениях и используйте возможности платформы
            </p>
            <Button 
              onClick={onNavigateToForum}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Icon name="MessageSquare" className="mr-2" size={18} />
              Перейти на форум
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {sortPlugins('newest').map((plugin, index) => (
            <div
              key={plugin.id}
              className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-5 hover:border-primary/50 transition-all duration-200 cursor-pointer animate-slide-up hover:scale-105 hover:shadow-lg"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <h3 className="text-base sm:text-lg font-bold mb-2">{plugin.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">{plugin.description}</p>
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                <span>{plugin.downloads} загрузок</span>
                <span>⭐ {plugin.rating}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};