import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';

const AUTH_URL = 'https://functions.poehali.dev/d4973344-e5cd-411c-8957-4c1d4d0072ab';

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

interface ReferralProgramPageProps {
  user: User;
}

const ReferralProgramPage = ({ user }: ReferralProgramPageProps) => {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    completed: 0,
    pending: 0,
    active: 0,
    can_claim: false,
    total_earned: 0,
    total_claimed: 0
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [canClaimBonus, setCanClaimBonus] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);

  useEffect(() => {
    loadReferralInfo();
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

  const loadReferralInfo = async () => {
    try {
      const response = await fetch(`${AUTH_URL}?action=get_referral_info`, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });

      const data = await response.json();

      if (data.success) {
        setReferralCode(data.referral_code || '');
        setReferrals(data.referrals || []);
        
        const activeCount = data.referrals.filter((r: Referral) => r.status === 'active').length;
        const totalBonus = data.referrals.reduce((sum: number, r: Referral) => sum + (r.bonus_earned || 0), 0);
        
        setStats({
          ...data.stats,
          active: activeCount,
          total_earned: totalBonus
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки реферальной информации:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast({
        title: 'Скопировано',
        description: 'Реферальный код скопирован в буфер обмена'
      });
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = referralCode;
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      
      if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        textArea.setSelectionRange(0, 999999);
      } else {
        textArea.select();
      }
      
      try {
        document.execCommand('copy');
        toast({
          title: 'Скопировано',
          description: 'Реферальный код скопирован в буфер обмена'
        });
      } catch (err) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось скопировать код',
          variant: 'destructive'
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const copyReferralLink = async () => {
    const link = `${window.location.origin}/?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Скопировано',
        description: 'Реферальная ссылка скопирована в буфер обмена'
      });
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      
      if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        textArea.setSelectionRange(0, 999999);
      } else {
        textArea.select();
      }
      
      try {
        document.execCommand('copy');
        toast({
          title: 'Скопировано',
          description: 'Реферальная ссылка скопирована в буфер обмена'
        });
      } catch (err) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось скопировать ссылку',
          variant: 'destructive'
        });
      } finally {
        document.body.removeChild(textArea);
      }
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
        
        loadReferralInfo();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Активный</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">Ожидание</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">Завершен</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={48} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Icon name="Users" size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Реферальная система</h1>
          <p className="text-sm text-muted-foreground">Зарабатывайте с каждым приглашенным пользователем</p>
        </div>
      </div>

      {canClaimBonus && (
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <Icon name="Gift" size={24} className="text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">🎁 Доступен приветственный бонус!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Вы зарегистрировались по реферальной ссылке. Получите 25 USDT в качестве приветственного бонуса!
              </p>
              <Button 
                onClick={handleClaimBonus} 
                disabled={claimingBonus}
                className="bg-green-500 hover:bg-green-600"
              >
                {claimingBonus ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Получение...
                  </>
                ) : (
                  <>
                    <Icon name="Gift" size={16} className="mr-2" />
                    Получить 25 USDT
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Icon name="Users" size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_referrals}</p>
              <p className="text-xs text-muted-foreground">Всего рефералов</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Icon name="CheckCircle2" size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Активных</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Icon name="Clock" size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Ожидают</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Icon name="DollarSign" size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_earned.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Заработано USDT</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Icon name="Hash" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">Ваш реферальный код</h3>
          </div>
          
          <div className="flex gap-2">
            <Input 
              value={referralCode}
              readOnly
              className="font-mono text-2xl font-bold text-center tracking-wider"
            />
            <Button onClick={copyReferralCode} className="shrink-0">
              <Icon name="Copy" size={16} className="mr-2" />
              Копировать
            </Button>
          </div>

          <div className="flex gap-2">
            <Input 
              value={`${window.location.origin}/?ref=${referralCode}`}
              readOnly
              className="text-sm"
            />
            <Button onClick={copyReferralLink} variant="outline" className="shrink-0">
              <Icon name="Link" size={16} className="mr-2" />
              Копировать ссылку
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Icon name="Gift" size={16} className="text-primary" />
              Как это работает:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Пользователь вводит ваш реферальный код при регистрации или переходит по вашей ссылке</li>
              <li>• Когда он пополняет баланс, вы получаете <span className="text-primary font-semibold">10% бонус</span> от суммы пополнения</li>
              <li>• Бонус начисляется автоматически и сразу доступен на балансе</li>
              <li>• Реферал становится "активным" после первого пополнения на 100+ USDT</li>
              <li>• За каждые 10 завершенных рефералов — дополнительная награда 250 USDT</li>
            </ul>
          </div>
        </div>
      </Card>

      {stats.completed >= 10 && (
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
              <Icon name="Trophy" size={24} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">🏆 Реферальная награда</h3>
              <p className="text-sm text-muted-foreground mb-3">
                У вас {stats.completed} завершенных рефералов! 
                {stats.can_claim ? ' Доступна награда 250 USDT!' : ' Вы уже получили награды за ' + Math.floor(stats.total_claimed / 250) * 10 + ' рефералов.'}
              </p>
              {stats.can_claim && (
                <Button 
                  onClick={handleClaimReward} 
                  disabled={claiming}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {claiming ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Получение...
                    </>
                  ) : (
                    <>
                      <Icon name="Trophy" size={16} className="mr-2" />
                      Получить 250 USDT
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Users" size={20} className="text-primary" />
              <h3 className="text-lg font-semibold">Мои рефералы</h3>
            </div>
            <Badge variant="secondary">{referrals.length}</Badge>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="UserPlus" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">У вас пока нет рефералов</p>
              <p className="text-sm text-muted-foreground">Поделитесь своим реферальным кодом или ссылкой, чтобы начать зарабатывать</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <Card key={referral.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <Icon name="User" size={18} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{referral.referred_username}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {referral.status === 'active' && (
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-semibold text-green-400">
                            +{(referral.bonus_earned || 0).toFixed(2)} USDT
                          </p>
                          <p className="text-xs text-muted-foreground">Бонус</p>
                        </div>
                      )}
                      {getStatusBadge(referral.status)}
                    </div>
                  </div>

                  {referral.status === 'active' && (
                    <div className="mt-3 pt-3 border-t border-border/50 sm:hidden">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Бонус: </span>
                        <span className="font-semibold text-green-400">+{(referral.bonus_earned || 0).toFixed(2)} USDT</span>
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Icon name="TrendingUp" size={24} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Увеличивайте свой доход</h3>
            <p className="text-sm text-muted-foreground">
              Чем больше ваши рефералы пополняют баланс, тем больше вы зарабатываете. 
              10% от каждого пополнения автоматически начисляется на ваш баланс.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="bg-background/50">
                <Icon name="Zap" size={12} className="mr-1" />
                Мгновенные выплаты
              </Badge>
              <Badge variant="outline" className="bg-background/50">
                <Icon name="Infinity" size={12} className="mr-1" />
                Без ограничений
              </Badge>
              <Badge variant="outline" className="bg-background/50">
                <Icon name="Shield" size={12} className="mr-1" />
                Честно и прозрачно
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReferralProgramPage;
