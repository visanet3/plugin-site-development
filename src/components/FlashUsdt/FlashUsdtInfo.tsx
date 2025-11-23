import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const FlashUsdtInfo = () => {
  return (
    <>
      <Card className="p-4 sm:p-6 md:p-8 border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Icon name="Info" size={24} className="text-yellow-400 sm:w-7 sm:h-7" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Что такое Flash USDT?</h2>
        </div>
        
        <div className="space-y-3 sm:space-y-4 text-muted-foreground leading-relaxed">
          <p className="text-sm sm:text-base">
            <strong className="text-foreground">Flash USDT</strong> — это временный токен стандарта TRC20, полностью совместимый с экосистемой TRON. 
            Токен имеет ограниченный срок действия и автоматически исчезает через 120 дней после активации.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
            <div>
              <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-foreground text-sm sm:text-base">
                <Icon name="CheckCircle2" size={18} className="text-green-400 sm:w-5 sm:h-5" />
                Преимущества
              </h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-start gap-1.5 sm:gap-2">
                  <Icon name="Zap" size={14} className="text-yellow-400 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
                  <span><strong>Мгновенная активация:</strong> Заходит на кошелек без добавления контракта</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Wallet" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Универсальность:</strong> Работает с биржами, DEX и TRC20 кошельками</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="DollarSign" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Выгодная цена:</strong> Всего 20% от номинальной стоимости USDT</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Rocket" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Быстрые транзакции:</strong> Скорость сети TRON (~3 секунды)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Coins" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Низкие комиссии:</strong> Минимальные gas fees в сети TRON</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-foreground text-sm sm:text-base">
                <Icon name="AlertCircle" size={18} className="text-orange-400 sm:w-5 sm:h-5" />
                Важно знать
              </h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-start gap-2">
                  <Icon name="Clock" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Срок действия:</strong> Токен автоматически исчезает через 120 дней</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Shield" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Использование:</strong> Подходит для краткосрочных операций и тестирования</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="TrendingUp" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Торговля:</strong> Принимается на DEX и централизованных биржах</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="FileText" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Стандарт:</strong> Полная совместимость с TRC20 протоколом</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Ban" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Автоуничтожение:</strong> Невозможно продлить срок действия токена</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 md:p-8 border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Icon name="AlertTriangle" size={24} className="text-red-400 sm:w-7 sm:h-7" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Предупреждение</h2>
        </div>
        
        <div className="space-y-3 sm:space-y-4 text-muted-foreground">
          <p className="text-sm sm:text-base">
            <strong className="text-foreground">Flash USDT — это временный токен.</strong> Перед покупкой убедитесь, что вы понимаете все условия:
          </p>
          
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <li className="flex items-start gap-1.5 sm:gap-2">
              <Icon name="AlertCircle" size={14} className="text-red-400 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
              <span>Токен автоматически исчезает через 120 дней после активации</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span>Невозможно конвертировать Flash USDT обратно в обычный USDT после покупки</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span>Используйте токен только для краткосрочных операций и тестирования</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span>Администрация не несет ответственности за убытки, связанные с истечением срока действия токена</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span>Минимальная сумма покупки: 100,000 Flash USDT (20,000 USDT)</span>
            </li>
          </ul>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 md:p-8 border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Icon name="HelpCircle" size={24} className="text-green-400 sm:w-7 sm:h-7" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Частые вопросы</h2>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h3 className="font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <Icon name="CircleDot" size={14} className="text-green-400 sm:w-4 sm:h-4" />
              Как активировать Flash USDT?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground ml-5 sm:ml-6">
              После покупки токены автоматически появятся на вашем TRC20 кошельке. Добавление контракта не требуется.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Icon name="CircleDot" size={16} className="text-green-400" />
              На каких биржах принимается Flash USDT?
            </h3>
            <p className="text-sm text-muted-foreground ml-6">
              Токен совместим с любыми TRC20-кошельками, DEX-платформами и централизованными биржами, поддерживающими TRON.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Icon name="CircleDot" size={16} className="text-green-400" />
              Что происходит через 120 дней?
            </h3>
            <p className="text-sm text-muted-foreground ml-6">
              Токены автоматически уничтожаются и исчезают с вашего кошелька. Продление срока действия невозможно.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Icon name="CircleDot" size={16} className="text-green-400" />
              Для чего используется Flash USDT?
            </h3>
            <p className="text-sm text-muted-foreground ml-6">
              Идеально подходит для краткосрочной торговли, арбитража, тестирования DeFi-протоколов и временных операций.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
};