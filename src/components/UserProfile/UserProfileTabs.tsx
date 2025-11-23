import { User, Transaction } from '@/types';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { WithdrawalView } from '@/components/WithdrawalView';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { ReferralTab } from './ReferralTab';

const PASSWORD_RESET_URL = 'https://functions.poehali.dev/d4973344-e5cd-411c-8957-4c1d4d0072ab';

interface UserProfileTabsProps {
  user: User;
  isOwnProfile: boolean;
  activeTab: string;
  transactions: Transaction[];
  transactionsLoading: boolean;
  onTabChange: (tab: string) => void;
  onUpdateProfile?: (profileData: Partial<User>) => void;
  showWithdrawalDialog: boolean;
  onCloseWithdrawalDialog: () => void;
}

export const UserProfileTabs = ({
  user,
  isOwnProfile,
  activeTab,
  transactions,
  transactionsLoading,
  onTabChange,
  onUpdateProfile,
  showWithdrawalDialog,
  onCloseWithdrawalDialog
}: UserProfileTabsProps) => {
  const { toast } = useToast();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      const response = await fetch(PASSWORD_RESET_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'request_reset',
          email: user.email
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Письмо отправлено',
          description: `Ссылка для сброса пароля отправлена на ${user.email}`,
          duration: 10000
        });
        setShowPasswordReset(false);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка сброса пароля',
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
      setResetLoading(false);
    }
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="text-xs sm:text-sm">Настройки</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm">Транзакции</TabsTrigger>
          <TabsTrigger value="referrals" className="text-xs sm:text-sm">Рефералы</TabsTrigger>
        </TabsList>

      <TabsContent value="transactions" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
        {transactionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <Card className="p-4 sm:p-6 md:p-8 text-center">
            <Icon name="Receipt" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">История транзакций пуста</p>
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {transactions.map((transaction) => {
              const getTransactionIcon = () => {
                if (transaction.type === 'escrow_sale') return { icon: 'ShoppingBag', color: 'green' };
                if (transaction.type === 'escrow_purchase') return { icon: 'ShoppingCart', color: 'blue' };
                if (transaction.type === 'escrow_complete') return { icon: 'CheckCircle2', color: 'gray' };
                if (transaction.type === 'blackjack_win') return { icon: 'Spade', color: 'green' };
                if (transaction.type === 'blackjack_loss') return { icon: 'Spade', color: 'red' };
                if (transaction.type === 'topup') return { icon: 'Wallet', color: 'green' };
                if (transaction.amount > 0) return { icon: 'ArrowDownToLine', color: 'green' };
                return { icon: 'ArrowUpFromLine', color: 'red' };
              };

              const { icon, color } = getTransactionIcon();
              const amount = Number(transaction.amount);
              const isPositive = amount > 0;
              const isNeutral = amount === 0;

              return (
                <Card key={transaction.id} className="p-3 sm:p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        color === 'green' ? 'bg-green-500/20' : 
                        color === 'blue' ? 'bg-blue-500/20' : 
                        color === 'gray' ? 'bg-gray-500/20' : 
                        'bg-red-500/20'
                      }`}>
                        <Icon 
                          name={icon as any} 
                          size={16} 
                          className={`sm:w-5 sm:h-5 ${
                            color === 'green' ? 'text-green-400' : 
                            color === 'blue' ? 'text-blue-400' : 
                            color === 'gray' ? 'text-gray-400' : 
                            'text-red-400'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {new Date(transaction.created_at).toLocaleString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm sm:text-base md:text-lg font-bold shrink-0 ${
                      isNeutral ? 'text-muted-foreground' :
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {!isNeutral && (isPositive ? '+' : '')}{amount.toFixed(2)} USDT
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="settings" className="space-y-4 mt-4">
        {isOwnProfile && onUpdateProfile && (
          <>
            <div>
              <Label className="text-sm font-medium mb-2 block">О себе</Label>
              <Textarea 
                defaultValue={user.bio || ''}
                onBlur={(e) => onUpdateProfile({ bio: e.target.value })}
                className="min-h-[100px]"
                placeholder="Расскажите о себе..."
              />
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <Label className="text-sm font-medium">Социальные сети</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                    <Icon name="Send" size={14} />
                    Telegram
                  </Label>
                  <Input 
                    defaultValue={user.telegram || ''}
                    onBlur={(e) => onUpdateProfile({ telegram: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                    <Icon name="MessageSquare" size={14} />
                    Discord
                  </Label>
                  <Input 
                    defaultValue={user.discord || ''}
                    onBlur={(e) => onUpdateProfile({ discord: e.target.value })}
                    placeholder="username#1234"
                  />
                </div>
              </div>
            </div>

            <Card className="p-3 sm:p-4 bg-orange-500/5 border-orange-500/20">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-semibold mb-1 flex items-center gap-2">
                    <Icon name="Key" size={16} className="text-orange-400 sm:w-[18px] sm:h-[18px]" />
                    Сброс пароля
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">
                    Новый пароль будет отправлен на email: {user.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="flex-shrink-0 w-full sm:w-auto text-xs sm:text-sm"
                >
                  {resetLoading ? (
                    <Icon name="Loader2" size={14} className="animate-spin mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                  ) : (
                    <Icon name="RefreshCw" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                  )}
                  Сбросить пароль
                </Button>
              </div>
            </Card>
          </>
        )}
      </TabsContent>

      <TabsContent value="referrals" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
        {isOwnProfile ? (
          <ReferralTab user={user} />
        ) : (
          <Card className="p-4 sm:p-6 md:p-8 text-center">
            <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Реферальная информация доступна только владельцу профиля</p>
          </Card>
        )}
      </TabsContent>

      </Tabs>

      <Dialog open={showWithdrawalDialog} onOpenChange={onCloseWithdrawalDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <WithdrawalView 
            user={user}
            onShowAuthDialog={() => {}}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};