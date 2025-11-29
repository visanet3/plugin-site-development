import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Referral {
  id: number;
  status: string;
  total_deposited: number;
  created_at: string;
  completed_at?: string;
  referred_username: string;
  bonus_earned: number;
}

interface ReferralStats {
  total_referrals: number;
  completed: number;
  pending: number;
  active: number;
  can_claim: boolean;
  total_earned: number;
  total_claimed: number;
}

interface ReferralsListProps {
  referrals: Referral[];
  stats: ReferralStats;
  claiming: boolean;
  onClaimReward: () => void;
}

export const ReferralsList = ({ referrals, stats, claiming, onClaimReward }: ReferralsListProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Выполнено</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Ожидает</Badge>;
      case 'active':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Активен</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Icon name="Users" size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Мои рефералы</h2>
            <p className="text-sm text-muted-foreground">{referrals.length} пользователей</p>
          </div>
        </div>
        {stats.can_claim && (
          <Button
            onClick={onClaimReward}
            disabled={claiming}
            className="bg-primary hover:bg-primary/90"
          >
            {claiming ? 'Получение...' : 'Получить награду'}
          </Button>
        )}
      </div>

      {referrals.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Icon name="Users" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Пока нет рефералов</h3>
          <p className="text-muted-foreground text-sm">
            Поделитесь реферальным кодом, чтобы начать зарабатывать
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((referral) => (
            <Card key={referral.id} className="p-4 bg-background/50 hover:bg-background/80 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Icon name="User" size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{referral.referred_username}</span>
                      {getStatusBadge(referral.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Зарегистрирован: {formatDate(referral.created_at)}
                      {referral.completed_at && (
                        <> • Выполнено: {formatDate(referral.completed_at)}</>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    +{Number(referral.bonus_earned || 0).toFixed(2)} USDT
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Пополнено: {Number(referral.total_deposited || 0).toFixed(2)} USDT
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};