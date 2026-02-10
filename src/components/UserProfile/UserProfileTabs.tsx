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

import VerificationForm from '@/components/VerificationForm';
import { AUTH_URL } from '@/lib/api-urls';

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
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Новый пароль должен быть не менее 6 символов',
        variant: 'destructive'
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive'
      });
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'change_password',
          old_password: oldPassword,
          new_password: newPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно!',
          description: 'Пароль успешно изменён'
        });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось изменить пароль',
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
      setChangingPassword(false);
    }
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm p-1 rounded-xl h-auto">
          <TabsTrigger value="settings" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Icon name="Settings" size={16} className="mr-1.5 sm:mr-2" />
            Настройки
          </TabsTrigger>
          <TabsTrigger value="verification" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Icon name="ShieldCheck" size={16} className="mr-1.5 sm:mr-2" />
            Верификация
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
            <Icon name="Receipt" size={16} className="mr-1.5 sm:mr-2" />
            Транзакции
          </TabsTrigger>
        </TabsList>

      <TabsContent value="verification" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
        {isOwnProfile && (
          <VerificationForm user={user} />
        )}
      </TabsContent>

      <TabsContent value="transactions" className="space-y-3 mt-4">
        {transactionsLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Icon name="Loader2" size={40} className="animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Загрузка транзакций...</p>
          </div>
        ) : transactions.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center border-border/50">
            <div className="relative mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl blur-xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl flex items-center justify-center">
                <Icon name="Receipt" size={32} className="text-muted-foreground sm:w-10 sm:h-10" />
              </div>
            </div>
            <p className="text-base font-medium text-muted-foreground">История транзакций пуста</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Здесь будут отображаться все ваши операции</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((transaction) => {
              const getTransactionIcon = () => {
                // Крипто-пополнения с разными статусами
                if (transaction.type === 'crypto_payment') {
                  if (transaction.status === 'pending') return { icon: 'Clock', color: 'yellow' };
                  if (transaction.status === 'confirmed') return { icon: 'BadgeCheck', color: 'green' };
                  if (transaction.status === 'cancelled') return { icon: 'XCircle', color: 'red' };
                  return { icon: 'Wallet', color: 'blue' };
                }
                
                if (transaction.type === 'escrow_sale') return { icon: 'ShoppingBag', color: 'green' };
                if (transaction.type === 'escrow_purchase') return { icon: 'ShoppingCart', color: 'blue' };
                if (transaction.type === 'escrow_complete') return { icon: 'CheckCircle2', color: 'gray' };

                if (transaction.type === 'topup') return { icon: 'Wallet', color: 'green' };
                if (transaction.amount > 0) return { icon: 'ArrowDownToLine', color: 'green' };
                return { icon: 'ArrowUpFromLine', color: 'red' };
              };

              const { icon, color } = getTransactionIcon();
              const amount = Number(transaction.amount);
              const isPositive = amount > 0;
              const isNeutral = amount === 0;
              const isCryptoPayment = transaction.type === 'crypto_payment';
              const isPending = transaction.status === 'pending';

              return (
                <Card key={`${transaction.type}-${transaction.id}`} className={`p-3 sm:p-4 hover:bg-accent/50 transition-all hover:shadow-md group border-border/50 ${isPending ? 'opacity-70' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${
                        color === 'green' ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 
                        color === 'blue' ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' : 
                        color === 'yellow' ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20' :
                        color === 'gray' ? 'bg-gradient-to-br from-gray-500/20 to-slate-500/20' : 
                        'bg-gradient-to-br from-red-500/20 to-orange-500/20'
                      }`}>
                        <Icon 
                          name={icon} 
                          size={18} 
                          className={`sm:w-5 sm:h-5 ${
                            color === 'green' ? 'text-green-400' : 
                            color === 'blue' ? 'text-blue-400' : 
                            color === 'yellow' ? 'text-yellow-400' :
                            color === 'gray' ? 'text-gray-400' : 
                            'text-red-400'
                          } ${isPending ? 'animate-pulse' : ''}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base truncate">{transaction.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-muted-foreground/80 truncate flex items-center gap-1">
                            <Icon name="Clock" size={10} />
                            {new Date(transaction.created_at).toLocaleString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {isCryptoPayment && transaction.tx_hash && (
                            <a 
                              href={`https://tronscan.org/#/transaction/${transaction.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <Icon name="ExternalLink" size={10} />
                              TX
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`text-base sm:text-lg font-black shrink-0 ${
                      isPending ? 'text-yellow-400' :
                      isNeutral ? 'text-muted-foreground' :
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {!isNeutral && (isPositive ? '+' : '')}{amount.toFixed(2)}
                      <span className="text-xs font-medium ml-0.5">₮</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="settings" className="space-y-5 mt-4">
        {isOwnProfile && onUpdateProfile && (
          <>
            <Card className="p-4 border-border/50 hover:border-border/80 transition-colors">
              <Label className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <Icon name="User" size={16} />
                О себе
              </Label>
              <Textarea 
                defaultValue={user.bio || ''}
                onBlur={(e) => onUpdateProfile({ bio: e.target.value })}
                className="min-h-[120px] resize-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Расскажите о себе..."
              />
            </Card>
            
            <Card className="p-4 border-border/50 hover:border-border/80 transition-colors">
              <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Icon name="Link" size={16} />
                Социальные сети
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Icon name="Send" size={14} />
                    Telegram
                  </Label>
                  <Input 
                    defaultValue={user.telegram || ''}
                    onBlur={(e) => onUpdateProfile({ telegram: e.target.value })}
                    placeholder="@username"
                    className="focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Icon name="MessageSquare" size={14} />
                    Discord
                  </Label>
                  <Input 
                    defaultValue={user.discord || ''}
                    onBlur={(e) => onUpdateProfile({ discord: e.target.value })}
                    placeholder="username#1234"
                    className="focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </Card>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-lg" />
              <Card className="relative bg-gradient-to-br from-orange-950/40 to-red-950/40 border-orange-500/40 backdrop-blur-sm">
                <form onSubmit={handleChangePassword} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl blur-md opacity-75" />
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <Icon name="Key" size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-orange-400 mb-1">Сброс пароля</h4>
                      <p className="text-xs text-orange-300/70">
                        Введите старый пароль и новый пароль для смены
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-orange-300/70 mb-1.5">Старый пароль</Label>
                      <Input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Введите старый пароль"
                        required
                        className="bg-orange-950/20 border-orange-500/30 focus:border-orange-500/50 text-white placeholder:text-orange-300/30"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-orange-300/70 mb-1.5">Новый пароль</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Минимум 6 символов"
                        required
                        minLength={6}
                        className="bg-orange-950/20 border-orange-500/30 focus:border-orange-500/50 text-white placeholder:text-orange-300/30"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-orange-300/70 mb-1.5">Повторите новый пароль</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Повторите новый пароль"
                        required
                        minLength={6}
                        className="bg-orange-950/20 border-orange-500/30 focus:border-orange-500/50 text-white placeholder:text-orange-300/30"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 font-medium"
                    >
                      {changingPassword ? (
                        <>
                          <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                          Изменение...
                        </>
                      ) : (
                        <>
                          <Icon name="Check" size={16} className="mr-2" />
                          Изменить пароль
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </>
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