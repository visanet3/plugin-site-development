import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { ReferralStatsCard } from '@/components/referral/ReferralStatsCard';
import { ReferralCodeCard } from '@/components/referral/ReferralCodeCard';
import { ReferralBonusCard } from '@/components/referral/ReferralBonusCard';
import { ReferralsList } from '@/components/referral/ReferralsList';
import { copyToClipboard } from '@/utils/clipboard';
import { AUTH_URL } from '@/lib/api-urls';

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
      console.log('Referral info response:', data);

      if (data.success) {
        const code = data.referral_code || user.referral_code || '';
        console.log('Setting referral code:', code);
        setReferralCode(code);
        setReferrals(data.referrals || []);
        
        const activeCount = data.referrals.filter((r: Referral) => r.status === 'active').length;
        const totalBonus = data.referrals.reduce((sum: number, r: Referral) => {
          const bonus = parseFloat(String(r.bonus_earned || 0));
          return sum + (isNaN(bonus) ? 0 : bonus);
        }, 0);
        
        setStats({
          ...data.stats,
          active: activeCount,
          total_earned: totalBonus
        });
      } else {
        console.error('Failed to load referral info:', data);
      }
    } catch (error) {
      console.error('Ошибка загрузки реферальной информации:', error);
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('User data from localStorage:', userData);
        if (userData.referral_code) {
          setReferralCode(userData.referral_code);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    const success = await copyToClipboard(referralCode);
    if (success) {
      toast({
        title: 'Скопировано',
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
    const link = `https://gitcrypto.pro/?ref=${referralCode}`;
    const success = await copyToClipboard(link);
    if (success) {
      toast({
        title: 'Скопировано',
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Реферальная программа
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Приглашайте друзей и зарабатывайте вместе
          </p>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl p-6 md:p-8 border border-primary/20 mb-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-3xl">💰</span>
                Как работает программа
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Зарабатывайте на каждом пополнении ваших рефералов автоматически. Чем больше активных рефералов — тем выше ваш доход!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-5 border border-border/50">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <span className="text-2xl">🎁</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Для приглашающего</h3>
                    <p className="text-sm text-muted-foreground">Вы получаете постоянный доход</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span><strong>10% от каждого пополнения</strong> вашего реферала</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Бонус начисляется <strong>мгновенно и автоматически</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span><strong>Неограниченное количество</strong> рефералов</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Доход от <strong>каждого пополнения</strong>, без лимитов</span>
                  </li>
                </ul>
              </div>

              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-5 border border-border/50">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Для приглашенного</h3>
                    <p className="text-sm text-muted-foreground">Бонус за регистрацию</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    <span>Бонус <strong>$3 USDT</strong> за первое пополнение</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    <span>Минимальное пополнение: <strong>$10</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    <span>Бонус можно получить через кнопку <strong>"Получить бонус"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    <span>Разовый бонус при выполнении условия</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Пример расчета</h4>
                  <p className="text-sm text-muted-foreground">
                    Ваш реферал пополнил счет на <strong>$100</strong> → вы получаете <strong>$10</strong> (10%). 
                    Реферал пополнил еще на <strong>$200</strong> → вы получаете еще <strong>$20</strong>. 
                    И так с каждого пополнения!
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                📊 Вся статистика по рефералам и заработок доступны ниже на этой странице
              </p>
            </div>
          </div>
        </div>

        <ReferralStatsCard stats={stats} loading={loading} />

        <div className="grid md:grid-cols-1 gap-6">
          <ReferralCodeCard
            referralCode={referralCode}
            onCopyCode={copyReferralCode}
            onCopyLink={copyReferralLink}
          />
        </div>

        <ReferralBonusCard
          canClaimBonus={canClaimBonus}
          claimingBonus={claimingBonus}
          onClaimBonus={handleClaimBonus}
        />

        <ReferralsList
          referrals={referrals}
          stats={stats}
          claiming={claiming}
          onClaimReward={handleClaimReward}
        />
      </div>
    </div>
  );
};

export default ReferralProgramPage;