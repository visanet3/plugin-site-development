import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface LotteryRulesProps {
  ticketPrice: number;
  prizeAmount: number;
  drawDelayMinutes: number;
}

const LotteryRules = ({ ticketPrice, prizeAmount, drawDelayMinutes }: LotteryRulesProps) => {
  return (
    <Card className="p-6 bg-card/50">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Icon name="Info" size={20} className="text-indigo-400" />
        Правила лотереи
      </h3>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>• <strong>Билетов:</strong> всего 10 мест в каждом розыгрыше</p>
        <p>• <strong>Цена билета:</strong> {ticketPrice} USDT</p>
        <p>• <strong>Приз:</strong> фиксированная сумма {prizeAmount} USDT победителю</p>
        <p>• <strong>Покупка:</strong> один игрок может купить неограниченное количество билетов</p>
        <p>• <strong>Розыгрыш:</strong> через {drawDelayMinutes} минуту после продажи всех билетов</p>
        <p>• <strong>Победитель:</strong> выбирается случайно из всех купленных билетов</p>
        <p>• <strong>Выплата:</strong> моментально на баланс победителя</p>
        <p>• <strong>Уведомления:</strong> все участники получат результаты розыгрыша</p>
        <p>• <strong>Чат:</strong> общайтесь с другими участниками во время ожидания розыгрыша</p>
      </div>
    </Card>
  );
};

export default LotteryRules;
