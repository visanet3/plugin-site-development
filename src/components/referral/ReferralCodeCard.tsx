import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReferralCodeCardProps {
  referralCode: string;
  onCopyCode: () => void;
  onCopyLink: () => void;
}

export const ReferralCodeCard = ({ referralCode, onCopyCode, onCopyLink }: ReferralCodeCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Icon name="Share2" size={24} className="text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Ваш реферальный код</h2>
          <p className="text-sm text-muted-foreground">Поделитесь с друзьями</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Реферальный код</label>
          <div className="flex gap-2">
            <Input
              value={referralCode || ''}
              readOnly
              placeholder={referralCode ? '' : 'Загрузка...'}
              className="font-mono text-lg"
            />
            <Button onClick={onCopyCode} variant="outline" size="icon" className="shrink-0" disabled={!referralCode}>
              <Icon name="Copy" size={18} />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Реферальная ссылка</label>
          <div className="flex gap-2">
            <Input
              value={referralCode ? `https://gitcrypto.pro/?ref=${referralCode}` : ''}
              readOnly
              placeholder={referralCode ? '' : 'Загрузка...'}
              className="font-mono text-sm"
            />
            <Button onClick={onCopyLink} variant="outline" size="icon" className="shrink-0" disabled={!referralCode}>
              <Icon name="Copy" size={18} />
            </Button>
          </div>
        </div>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-primary mt-0.5" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Пригласите друзей и зарабатывайте:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>10% от каждого пополнения друга</li>
                <li>Награда начисляется автоматически</li>
                <li>Минимум для вывода 100 USDT</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
};