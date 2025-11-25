import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ReferralStatsCardProps {
  stats: {
    total_referrals: number;
    completed: number;
    pending: number;
    active: number;
    can_claim: boolean;
    total_earned: number;
    total_claimed: number;
  };
  canClaimBonus: boolean;
  onClaimBonus: () => void;
  onClaimReward: () => void;
  claimingBonus: boolean;
  claiming: boolean;
}

export const ReferralStatsCard = ({
  stats,
  canClaimBonus,
  onClaimBonus,
  onClaimReward,
  claimingBonus,
  claiming
}: ReferralStatsCardProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Всего рефералов</p>
          <Icon name="Users" size={20} className="text-green-500" />
        </div>
        <p className="text-3xl font-bold">{stats.total_referrals}</p>
        <div className="mt-3 flex gap-2 text-xs">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            <Icon name="CheckCircle2" size={12} className="mr-1" />
            {stats.completed} завершено
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            <Icon name="Clock" size={12} className="mr-1" />
            {stats.pending} ожидает
          </Badge>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Активных</p>
          <Icon name="Activity" size={20} className="text-blue-500" />
        </div>
        <p className="text-3xl font-bold">{stats.active}</p>
        <p className="text-xs text-muted-foreground mt-3">
          Рефералы с активностью
        </p>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Заработано</p>
          <Icon name="DollarSign" size={20} className="text-purple-500" />
        </div>
        <p className="text-3xl font-bold">{stats.total_earned.toFixed(2)} USDT</p>
        {canClaimBonus && (
          <Button
            onClick={onClaimBonus}
            disabled={claimingBonus}
            size="sm"
            className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {claimingBonus ? (
              <>
                <Icon name="Loader2" size={14} className="mr-1 animate-spin" />
                Получение...
              </>
            ) : (
              <>
                <Icon name="Gift" size={14} className="mr-1" />
                Получить бонус 2 USDT
              </>
            )}
          </Button>
        )}
      </Card>

      <Card className="p-6 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/30">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Получено</p>
          <Icon name="Wallet" size={20} className="text-orange-500" />
        </div>
        <p className="text-3xl font-bold">{stats.total_claimed.toFixed(2)} USDT</p>
        {stats.can_claim && (
          <Button
            onClick={onClaimReward}
            disabled={claiming}
            size="sm"
            className="w-full mt-3 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
          >
            {claiming ? (
              <>
                <Icon name="Loader2" size={14} className="mr-1 animate-spin" />
                Получение...
              </>
            ) : (
              <>
                <Icon name="Gift" size={14} className="mr-1" />
                Получить награду
              </>
            )}
          </Button>
        )}
      </Card>
    </div>
  );
};
