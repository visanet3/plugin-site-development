import { User, Transaction } from '@/types';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface UserProfileTabsProps {
  user: User;
  isOwnProfile: boolean;
  activeTab: string;
  transactions: Transaction[];
  transactionsLoading: boolean;
  onTabChange: (tab: string) => void;
  onUpdateProfile?: (profileData: Partial<User>) => void;
}

export const UserProfileTabs = ({
  user,
  isOwnProfile,
  activeTab,
  transactions,
  transactionsLoading,
  onTabChange,
  onUpdateProfile
}: UserProfileTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="settings">Настройки</TabsTrigger>
        <TabsTrigger value="overview">Обзор</TabsTrigger>
        <TabsTrigger value="transactions">Транзакции</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-card/50 border-border hover:border-green-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-800/20 flex items-center justify-center">
                <Icon name="Download" size={20} className="text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Загрузок</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card/50 border-border hover:border-green-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-800/20 flex items-center justify-center">
                <Icon name="MessageSquare" size={20} className="text-green-700" />
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
                <Card key={transaction.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        color === 'green' ? 'bg-green-500/20' : 
                        color === 'blue' ? 'bg-blue-500/20' : 
                        color === 'gray' ? 'bg-gray-500/20' : 
                        'bg-red-500/20'
                      }`}>
                        <Icon 
                          name={icon as any} 
                          size={20} 
                          className={
                            color === 'green' ? 'text-green-400' : 
                            color === 'blue' ? 'text-blue-400' : 
                            color === 'gray' ? 'text-gray-400' : 
                            'text-red-400'
                          }
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
            
            <div className="space-y-4">
              <Label className="text-sm font-medium">Социальные сети</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                    <Icon name="MessageCircle" size={14} />
                    VK
                  </Label>
                  <Input 
                    defaultValue={user.vk_url || ''}
                    onBlur={(e) => onUpdateProfile({ vk_url: e.target.value })}
                    placeholder="https://vk.com/..."
                  />
                </div>
                
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
          </>
        )}
      </TabsContent>
    </Tabs>
  );
};