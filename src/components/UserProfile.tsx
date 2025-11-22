import { User, Transaction } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ForumRoleBadge from '@/components/ForumRoleBadge';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface UserProfileProps {
  user: User;
  isOwnProfile: boolean;
  onClose: () => void;
  onTopUpBalance?: (amount: number) => Promise<void>;
}

const UserProfile = ({ user, isOwnProfile, onClose, onTopUpBalance }: UserProfileProps) => {
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOwnProfile && activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, isOwnProfile]);

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const response = await fetch(`${AUTH_URL}?action=transactions`, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });
      const data = await response.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    setIsLoading(true);
    try {
      if (onTopUpBalance) {
        await onTopUpBalance(amount);
      }
      setShowTopUpDialog(false);
      setTopUpAmount('');
      if (activeTab === 'transactions') {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Ошибка пополнения баланса:', error);
      alert('Ошибка пополнения баланса');
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [10, 50, 100, 500];

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Личный кабинет</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon name="X" size={24} />
              </Button>
            </div>

            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl font-bold">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-2xl font-bold">{user.username}</h3>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <ForumRoleBadge role={user.forum_role} />
                  {user.role === 'admin' && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
                      Администратор
                    </span>
                  )}
                </div>

                {user.bio && (
                  <p className="text-foreground/80 mt-2">{user.bio}</p>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Icon name="Wallet" size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Баланс</p>
                      <p className="text-3xl font-bold">{(user.balance || 0).toFixed(2)} USDT</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowTopUpDialog(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Icon name="Plus" size={18} className="mr-2" />
                    Пополнить
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Используйте баланс в USDT для покупки плагинов, премиум подписки и других услуг
                </p>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="transactions">История транзакций</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-card/50 border-border hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Icon name="Download" size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Загрузок</p>
                        <p className="text-xl font-bold">0</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-card/50 border-border hover:border-pink-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <Icon name="MessageSquare" size={20} className="text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Сообщений</p>
                        <p className="text-xl font-bold">0</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-card/50 border-border hover:border-cyan-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Icon name="Star" size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Рейтинг</p>
                        <p className="text-xl font-bold">0</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Социальные сети</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {user.vk_url && (
                      <a 
                        href={user.vk_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                      >
                        <Icon name="ExternalLink" size={20} className="text-blue-400" />
                        <span className="text-blue-400">ВКонтакте</span>
                      </a>
                    )}
                    {user.telegram && (
                      <div className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <Icon name="MessageCircle" size={20} className="text-cyan-400" />
                        <span className="text-cyan-400">{user.telegram}</span>
                      </div>
                    )}
                    {user.discord && (
                      <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <Icon name="Hash" size={20} className="text-indigo-400" />
                        <span className="text-indigo-400">{user.discord}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4 mt-4">
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Icon name="Receipt" size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">История транзакций пуста</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              transaction.amount > 0 
                                ? 'bg-green-500/20' 
                                : 'bg-red-500/20'
                            }`}>
                              <Icon 
                                name={transaction.amount > 0 ? 'ArrowDownToLine' : 'ArrowUpFromLine'} 
                                size={20} 
                                className={transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}
                              />
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
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
                          <div className={`text-lg font-bold ${
                            transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} USDT
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>

      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Пополнение баланса</DialogTitle>
            <DialogDescription>
              Выберите сумму или введите свою
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setTopUpAmount(amount.toString())}
                  className="h-16 text-lg font-semibold"
                >
                  {amount} USDT
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Другая сумма</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Введите сумму"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min="1"
                step="1"
              />
            </div>

            <Button 
              onClick={handleTopUp}
              disabled={isLoading || !topUpAmount}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Icon name="CreditCard" size={18} className="mr-2" />
                  Пополнить на {topUpAmount || '0'} USDT
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              После нажатия вы будете перенаправлены на страницу оплаты
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserProfile;