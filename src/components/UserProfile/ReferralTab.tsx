import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';
import { CopyButtonIcon } from '@/components/ui/copy-button-icon';
import { AUTH_URL } from '@/lib/api-urls';

interface ReferralData {
  id: number;
  status: string;
  total_deposited: number;
  created_at: string;
  completed_at?: string;
  referred_username: string;
}

interface ReferralStats {
  total_referrals: number;
  completed: number;
  pending: number;
  can_claim: boolean;
  total_earned: number;
  total_claimed: number;
}

interface ReferralTabProps {
  user: User;
}

export const ReferralTab = ({ user }: ReferralTabProps) => {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    completed: 0,
    pending: 0,
    can_claim: false,
    total_earned: 0,
    total_claimed: 0
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [canClaimBonus, setCanClaimBonus] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);

  useEffect(() => {
    fetchReferralInfo();
    checkBonusAvailability();
  }, [user.id]);

  const checkBonusAvailability = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      const hasReferralCode = userData.referred_by_code && userData.referred_by_code.length > 0;
      const bonusClaimed = userData.referral_bonus_claimed === true;
      setCanClaimBonus(hasReferralCode && !bonusClaimed);
    }
  };

  const fetchReferralInfo = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'get_referral_info'
        })
      });

      const data = await response.json();

      if (data.success) {
        setReferralCode(data.referral_code || '');
        setReferrals(data.referrals || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Ошибка загрузки реферальной информации:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    const success = await copyToClipboard(referralCode);
    if (success) {
      toast({
        title: 'Скопировано!',
        description: 'Реферальный код скопирован в буфер обмена'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать код',
        variant: 'destructive'
      });
    }
  };

  const copyReferralLink = async () => {
    const link = `${window.location.origin}/?ref=${referralCode}`;
    const success = await copyToClipboard(link);
    if (success) {
      toast({
        title: 'Скопировано!',
        description: 'Реферальная ссылка скопирована в буфер обмена'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать ссылку',
        variant: 'destructive'
      });
    }
  };

  const handleClaimBonus = async () => {
    setClaimingBonus(true);
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'claim_referral_bonus'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '🎁 Бонус получен!',
          description: `Вам начислено ${data.bonus_amount} USDT. Новый баланс: ${data.new_balance} USDT`
        });
        
        const updatedUser = { ...user, balance: data.new_balance, referral_bonus_claimed: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        Object.assign(user, updatedUser);
        
        setCanClaimBonus(false);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка получения бонуса',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setClaimingBonus(false);
    }
  };

  const handleClaimReward = async () => {
    setClaiming(true);
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'claim_referral_reward'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '🎉 Награда получена!',
          description: `Вам начислено ${data.reward_amount} USDT. Новый баланс: ${data.new_balance} USDT`
        });
        
        const updatedUser = { ...user, balance: data.new_balance };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        Object.assign(user, updatedUser);
        
        fetchReferralInfo();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка получения награды',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progressPercentage = Math.min((stats.completed / 10) * 100, 100);

  return (
    <div className="space-y-4">
      {canClaimBonus && (
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/40 animate-pulse-slow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/30 flex items-center justify-center">
              <Icon name="Gift" size={24} className="text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                🎁 Приветственный бонус!
              </h3>
              <p className="text-sm text-muted-foreground">Вы использовали реферальный код при регистрации</p>
            </div>
          </div>

          <div className="bg-background/50 rounded-lg p-4 mb-4">
            <p className="text-sm mb-2">
              <strong>Поздравляем!</strong> Вы получили доступ к бонусу за использование реферального кода.
            </p>
            <p className="text-lg font-bold text-yellow-400">
              <Icon name="DollarSign" size={20} className="inline mr-1" />
              25 USDT ждут вас!
            </p>
          </div>

          <Button 
            onClick={handleClaimBonus}
            disabled={claimingBonus}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
            size="lg"
          >
            {claimingBonus ? (
              <>
                <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                Получение бонуса...
              </>
            ) : (
              <>
                <Icon name="Gift" size={18} className="mr-2" />
                Получить 25 USDT
              </>
            )}
          </Button>
        </Card>
      )}

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Icon name="Users" size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Реферальная программа</h3>
            <p className="text-sm text-muted-foreground">Приглашай друзей и получай награды!</p>
          </div>
        </div>

        <div className="bg-background/50 rounded-lg p-4 mb-4">
          <p className="text-sm mb-3">
            <Icon name="Gift" size={16} className="inline mr-2 text-primary" />
            <strong>Условия:</strong> Приведи 10 пользователей, которые пополнят баланс на 100+ USDT
          </p>
          <p className="text-sm">
            <Icon name="DollarSign" size={16} className="inline mr-2 text-green-500" />
            <strong>Награда:</strong> 250 USDT за каждые 10 завершенных рефералов
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Твой реферальный код</label>
            <div className="flex gap-2">
              <Input 
                value={referralCode} 
                readOnly 
                className="font-mono text-lg font-bold"
              />
              <div className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                <CopyButtonIcon onCopy={copyReferralCode} size={18} />
              </div>
            </div>
          </div>

          <div className="w-full h-10 flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
            <CopyButtonIcon onCopy={copyReferralLink} size={16} />
            <span>Скопировать реферальную ссылку</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.total_referrals}</div>
          <div className="text-xs text-muted-foreground mt-1">Всего рефералов</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          <div className="text-xs text-muted-foreground mt-1">Завершено</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
          <div className="text-xs text-muted-foreground mt-1">В процессе</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{stats.total_claimed}</div>
          <div className="text-xs text-muted-foreground mt-1">Получено USDT</div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Прогресс до награды</h4>
          <span className="text-sm font-bold text-primary">{stats.completed} / 10</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-primary to-primary/60 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {stats.can_claim ? (
          <Button 
            onClick={handleClaimReward} 
            disabled={claiming}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {claiming ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Получение награды...
              </>
            ) : (
              <>
                <Icon name="Gift" size={16} className="mr-2" />
                Получить 250 USDT
              </>
            )}
          </Button>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            {stats.completed >= 10 
              ? 'Награда уже получена! Продолжай приглашать друзей.'
              : `Осталось привести ${10 - stats.completed} пользователей`
            }
          </div>
        )}
      </Card>

      {referrals.length > 0 && (
        <Card className="p-4 sm:p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="Users" size={18} />
            Твои рефералы ({referrals.length})
          </h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {referrals.map((ref) => (
              <div 
                key={ref.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{ref.referred_username}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ref.created_at).toLocaleDateString('ru')}
                  </div>
                </div>
                <div className="text-right mr-3">
                  <div className="text-sm font-semibold">{ref.total_deposited} USDT</div>
                  <div className="text-xs text-muted-foreground">пополнено</div>
                </div>
                <div>
                  {ref.status === 'completed' ? (
                    <div className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-medium flex items-center gap-1">
                      <Icon name="CheckCircle" size={14} />
                      Завершен
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-medium flex items-center gap-1">
                      <Icon name="Clock" size={14} />
                      {ref.total_deposited < 100 ? `${(100 - ref.total_deposited).toFixed(0)} до цели` : 'Ожидание'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};