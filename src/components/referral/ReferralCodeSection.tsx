import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ReferralCodeSectionProps {
  referralCode: string;
  onCopyCode: () => void;
  onCopyLink: () => void;
}

export const ReferralCodeSection = ({
  referralCode,
  onCopyCode,
  onCopyLink
}: ReferralCodeSectionProps) => {
  const referralLink = `https://gitcrypto.pro/?ref=${referralCode}`;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Icon name="Share2" size={20} className="text-primary" />
            Ваша реферальная программа
          </h2>
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Icon name="Gift" size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-primary">Получайте бонусы за приглашение друзей!</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Приглашенный получает 2 USDT при регистрации</li>
                  <li>Вы получаете 5% от всех пополнений реферала</li>
                  <li>Бонусы начисляются автоматически</li>
                  <li>Выплаты без ограничений</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ваш реферальный код</label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg"
              />
              <Button onClick={onCopyCode} size="icon" className="flex-shrink-0">
                <Icon name="Copy" size={18} />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Реферальная ссылка</label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={onCopyLink} size="icon" className="flex-shrink-0">
                <Icon name="Copy" size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
