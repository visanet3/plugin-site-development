import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const BusinessPlan = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-br from-green-800/20 via-green-900/10 to-background border border-green-800/30 rounded-2xl p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-600/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
            Инвестиционное предложение
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
            Flash USDT Token
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Инновационный токен на базе TRON TRC20 с гарантированным ROI 170-230%
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-card/50 backdrop-blur border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="DollarSign" size={24} className="text-green-400" />
                <h3 className="text-lg font-semibold">Инвестиции</h3>
              </div>
              <p className="text-3xl font-bold text-green-400">$100,000</p>
              <p className="text-sm text-muted-foreground mt-1">Требуемый капитал</p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="TrendingUp" size={24} className="text-green-400" />
                <h3 className="text-lg font-semibold">Доход</h3>
              </div>
              <p className="text-3xl font-bold text-green-400">$170K - $230K</p>
              <p className="text-sm text-muted-foreground mt-1">Прогнозируемая прибыль</p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="Calendar" size={24} className="text-green-400" />
                <h3 className="text-lg font-semibold">Срок</h3>
              </div>
              <p className="text-3xl font-bold text-green-400">12-18 мес</p>
              <p className="text-sm text-muted-foreground mt-1">Период окупаемости</p>
            </Card>
          </div>
        </div>
      </div>

      <Card className="p-8 border-green-500/20">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Target" size={28} className="text-green-400" />
          <h2 className="text-2xl font-bold">Бизнес-модель</h2>
        </div>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Flash USDT — это токен-клон оригинального USDT TRC20, предназначенный для временного использования в DeFi-протоколах. 
          Токен имеет ограниченный срок действия (flash period), что создает уникальную бизнес-модель с высокой маржинальностью.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Icon name="CheckCircle2" size={20} className="text-green-400" />
              Целевая аудитория
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• DeFi-трейдеры и арбитражники</li>
              <li>• Тестировщики смарт-контрактов</li>
              <li>• Разработчики блокчейн-приложений</li>
              <li>• Образовательные платформы</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Icon name="Zap" size={20} className="text-green-400" />
              Преимущества продукта
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Полная совместимость с TRC20</li>
              <li>• Низкие комиссии TRON (~$1)</li>
              <li>• Высокая скорость транзакций (3 сек)</li>
              <li>• Автоматическое управление сроками</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-8 border-orange-500/20 bg-orange-500/5">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Code2" size={28} className="text-orange-400" />
          <h2 className="text-2xl font-bold">Техническая реализация</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 text-orange-400">1. Смарт-контракт TRC20</h3>
            <Card className="p-4 bg-card/50">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>Язык:</strong> Solidity ^0.8.20</li>
                <li><strong>Стандарт:</strong> TRC20 (ERC20-совместимый)</li>
                <li><strong>Функции:</strong> mint(), burn(), transfer(), flashMint()</li>
                <li><strong>Безопасность:</strong> OpenZeppelin Contracts + Reentrancy Guard</li>
                <li><strong>Аудит:</strong> CertiK + internal security review</li>
                <li><strong>Gas оптимизация:</strong> <1 TRX за транзакцию</li>
              </ul>
            </Card>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-orange-400">2. Backend инфраструктура</h3>
            <Card className="p-4 bg-card/50">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>API:</strong> Node.js + Express.js + TypeScript</li>
                <li><strong>База данных:</strong> PostgreSQL + Redis (кэширование)</li>
                <li><strong>Блокчейн интеграция:</strong> TronWeb SDK + TronGrid API</li>
                <li><strong>Мониторинг:</strong> Webhooks для событий токена</li>
                <li><strong>Автоматизация:</strong> Cron jobs для управления flash периодами</li>
                <li><strong>Масштабирование:</strong> AWS EC2 + Load Balancer</li>
              </ul>
            </Card>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-orange-400">3. Веб-платформа</h3>
            <Card className="p-4 bg-card/50">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>Frontend:</strong> React + TypeScript + Vite</li>
                <li><strong>Web3 интеграция:</strong> TronLink Wallet + WalletConnect</li>
                <li><strong>UI/UX:</strong> Tailwind CSS + shadcn/ui</li>
                <li><strong>Аналитика:</strong> Dashboard с real-time данными</li>
                <li><strong>KYC/AML:</strong> Интеграция Sumsub или Onfido</li>
              </ul>
            </Card>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-orange-400">4. Безопасность</h3>
            <Card className="p-4 bg-card/50">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>Смарт-контракт:</strong> Multi-signature wallet (3/5)</li>
                <li><strong>Приватные ключи:</strong> AWS KMS + Hardware Security Module</li>
                <li><strong>DDoS защита:</strong> Cloudflare Enterprise</li>
                <li><strong>Мониторинг:</strong> 24/7 Security Operations Center</li>
                <li><strong>Bug Bounty:</strong> $50K программа поиска уязвимостей</li>
              </ul>
            </Card>
          </div>
        </div>
      </Card>

      <Card className="p-8 border-blue-500/20 bg-blue-500/5">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="PieChart" size={28} className="text-blue-400" />
          <h2 className="text-2xl font-bold">Распределение инвестиций ($100,000)</h2>
        </div>
        
        <div className="space-y-4">
          {[
            { label: 'Разработка смарт-контракта', amount: '$25,000', percentage: '25%', color: 'bg-blue-500' },
            { label: 'Аудит безопасности (CertiK + internal)', amount: '$15,000', percentage: '15%', color: 'bg-purple-500' },
            { label: 'Backend + инфраструктура', amount: '$20,000', percentage: '20%', color: 'bg-green-500' },
            { label: 'Frontend разработка', amount: '$12,000', percentage: '12%', color: 'bg-yellow-500' },
            { label: 'Маркетинг и продвижение', amount: '$15,000', percentage: '15%', color: 'bg-orange-500' },
            { label: 'Юридическое сопровождение', amount: '$8,000', percentage: '8%', color: 'bg-red-500' },
            { label: 'Резервный фонд', amount: '$5,000', percentage: '5%', color: 'bg-gray-500' },
          ].map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm font-bold text-green-400">{item.amount}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: item.percentage }}></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-8 border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="TrendingUp" size={28} className="text-purple-400" />
          <h2 className="text-2xl font-bold">Модель монетизации</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-purple-400">Источники дохода</h3>
            <div className="space-y-3">
              <Card className="p-4 bg-card/50">
                <h4 className="font-semibold mb-2">1. Комиссия за mint</h4>
                <p className="text-sm text-muted-foreground mb-1">5-10% от объема mint операций</p>
                <p className="text-xs text-green-400">~$120K-180K/год при $200K месячном обороте</p>
              </Card>
              
              <Card className="p-4 bg-card/50">
                <h4 className="font-semibold mb-2">2. Подписки Pro</h4>
                <p className="text-sm text-muted-foreground mb-1">$99-499/месяц для крупных клиентов</p>
                <p className="text-xs text-green-400">~$30K-50K/год (300-500 подписчиков)</p>
              </Card>
              
              <Card className="p-4 bg-card/50">
                <h4 className="font-semibold mb-2">3. API доступ</h4>
                <p className="text-sm text-muted-foreground mb-1">$0.01-0.05 за API вызов</p>
                <p className="text-xs text-green-400">~$20K-40K/год при 1M запросов/месяц</p>
              </Card>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3 text-purple-400">Финансовая проекция</h3>
            <div className="space-y-3">
              <Card className="p-4 bg-card/50 border-green-500/30">
                <h4 className="font-semibold mb-2 text-green-400">Месяцы 1-6 (Запуск)</h4>
                <p className="text-sm text-muted-foreground">Доход: $8K-15K/мес</p>
                <p className="text-sm text-muted-foreground">Расходы: $5K-8K/мес</p>
                <p className="text-sm font-bold text-green-400 mt-2">Прибыль: $18K-42K</p>
              </Card>
              
              <Card className="p-4 bg-card/50 border-green-500/30">
                <h4 className="font-semibold mb-2 text-green-400">Месяцы 7-12 (Рост)</h4>
                <p className="text-sm text-muted-foreground">Доход: $20K-35K/мес</p>
                <p className="text-sm text-muted-foreground">Расходы: $8K-12K/мес</p>
                <p className="text-sm font-bold text-green-400 mt-2">Прибыль: $72K-138K</p>
              </Card>
              
              <Card className="p-4 bg-card/50 border-green-500/30">
                <h4 className="font-semibold mb-2 text-green-400">Месяцы 13-18 (Масштабирование)</h4>
                <p className="text-sm text-muted-foreground">Доход: $40K-60K/мес</p>
                <p className="text-sm text-muted-foreground">Расходы: $15K-20K/мес</p>
                <p className="text-sm font-bold text-green-400 mt-2">Прибыль: $150K-240K</p>
              </Card>
            </div>
          </div>
        </div>

        <Card className="p-6 bg-green-500/10 border-green-500/30 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Итоговая прибыль инвестора за 18 месяцев</p>
              <p className="text-3xl font-bold text-green-400">$170,000 - $230,000</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">ROI</p>
              <p className="text-3xl font-bold text-green-400">170% - 230%</p>
            </div>
          </div>
        </Card>
      </Card>

      <Card className="p-8 border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="AlertTriangle" size={28} className="text-red-400" />
          <h2 className="text-2xl font-bold">Риски и их минимизация</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-card/50">
            <h4 className="font-semibold mb-2 text-red-400">Технические риски</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Уязвимости смарт-контракта</li>
              <li><strong>Решение:</strong> 3 независимых аудита</li>
            </ul>
          </Card>
          
          <Card className="p-4 bg-card/50">
            <h4 className="font-semibold mb-2 text-red-400">Регуляторные риски</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Изменение законодательства</li>
              <li><strong>Решение:</strong> Юридическая структура в crypto-friendly юрисдикции</li>
            </ul>
          </Card>
          
          <Card className="p-4 bg-card/50">
            <h4 className="font-semibold mb-2 text-red-400">Рыночные риски</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Низкий спрос на продукт</li>
              <li><strong>Решение:</strong> Pre-sale для 50+ клиентов перед запуском</li>
            </ul>
          </Card>
          
          <Card className="p-4 bg-card/50">
            <h4 className="font-semibold mb-2 text-red-400">Конкурентные риски</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Появление аналогов</li>
              <li><strong>Решение:</strong> Патентование технологии + first-mover advantage</li>
            </ul>
          </Card>
        </div>
      </Card>

      <Card className="p-8 border-green-500/30 bg-green-500/10">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Calendar" size={28} className="text-green-400" />
          <h2 className="text-2xl font-bold">Roadmap</h2>
        </div>
        
        <div className="space-y-4">
          {[
            { phase: 'Месяц 1-2', title: 'Разработка MVP', tasks: 'Смарт-контракт, базовый UI, тестирование' },
            { phase: 'Месяц 3', title: 'Аудит и запуск', tasks: 'Security аудит, mainnet deployment, beta тестирование' },
            { phase: 'Месяц 4-6', title: 'Рост базы', tasks: 'Маркетинг, привлечение первых 100 клиентов' },
            { phase: 'Месяц 7-12', title: 'Масштабирование', tasks: 'Расширение функционала, API, партнерства' },
            { phase: 'Месяц 13-18', title: 'Экспансия', tasks: 'Multi-chain поддержка, международный рынок' },
          ].map((item, index) => (
            <Card key={index} className="p-4 bg-card/50 hover:bg-card/80 transition-colors">
              <div className="flex items-start gap-4">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 whitespace-nowrap">
                  {item.phase}
                </Badge>
                <div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.tasks}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-8 border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5">
        <div className="text-center">
          <Icon name="Rocket" size={48} className="mx-auto mb-4 text-green-400" />
          <h2 className="text-3xl font-bold mb-4">Готовы инвестировать?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Flash USDT — это уникальная возможность войти в растущий рынок DeFi-инструментов 
            с гарантированной технической базой и проверенной бизнес-моделью.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-2">
              <Icon name="Shield" size={20} className="mr-2" />
              Полная прозрачность
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-2">
              <Icon name="Lock" size={20} className="mr-2" />
              Юридические гарантии
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-2">
              <Icon name="TrendingUp" size={20} className="mr-2" />
              ROI 170-230%
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BusinessPlan;
