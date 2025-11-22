import { User, Transaction } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import ForumRoleBadge from '@/components/ForumRoleBadge';
import { getAvatarGradient } from '@/utils/avatarColors';
import { QRCodeSVG } from 'qrcode.react';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const CRYPTO_URL = 'https://functions.poehali.dev/8caa3b76-72e5-42b5-9415-91d1f9b05210';

interface UserProfileProps {
  user: User;
  isOwnProfile: boolean;
  onClose: () => void;
  onTopUpBalance?: (amount: number) => Promise<void>;
  onUpdateProfile?: (profileData: Partial<User>) => void;
}

const UserProfile = ({ user, isOwnProfile, onClose, onTopUpBalance, onUpdateProfile }: UserProfileProps) => {
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [animatedBalance, setAnimatedBalance] = useState(user.balance || 0);
  const [isBalanceChanging, setIsBalanceChanging] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [showCryptoDialog, setShowCryptoDialog] = useState(false);
  const [cryptoPayment, setCryptoPayment] = useState<any>(null);
  const [paymentNetwork, setPaymentNetwork] = useState('TRC20');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOwnProfile && activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, isOwnProfile]);

  useEffect(() => {
    if (user.balance !== animatedBalance) {
      setIsBalanceChanging(true);
      const duration = 800;
      const steps = 30;
      const stepValue = (Number(user.balance) - Number(animatedBalance)) / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setAnimatedBalance(Number(user.balance));
          clearInterval(timer);
          setTimeout(() => setIsBalanceChanging(false), 300);
        } else {
          setAnimatedBalance(prev => Number(prev) + stepValue);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [user.balance]);

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
      const response = await fetch(CRYPTO_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'create_payment',
          amount: amount,
          network: paymentNetwork
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setCryptoPayment(data);
        setShowTopUpDialog(false);
        setShowCryptoDialog(true);
        setTopUpAmount('');
      } else {
        alert('Ошибка создания платежа');
      }
    } catch (error) {
      console.error('Ошибка создания платежа:', error);
      alert('Ошибка создания платежа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!cryptoPayment) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(CRYPTO_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'confirm_payment',
          payment_id: cryptoPayment.payment_id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        if (onTopUpBalance) {
          const updatedUser = { ...user, balance: data.new_balance };
          Object.assign(user, updatedUser);
        }
        setShowCryptoDialog(false);
        setCryptoPayment(null);
        if (activeTab === 'transactions') {
          fetchTransactions();
        }
        alert('Платёж подтверждён!');
      } else {
        alert('Ошибка подтверждения платежа');
      }
    } catch (error) {
      console.error('Ошибка подтверждения:', error);
      alert('Ошибка подтверждения платежа');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано!');
  };

  const handleAvatarSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5 МБ');
      return;
    }

    setAvatarUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setAvatarPreview(base64);

        const response = await fetch(AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify({
            action: 'upload_avatar',
            image: base64
          })
        });

        const data = await response.json();

        if (data.success && onUpdateProfile) {
          onUpdateProfile({ avatar_url: data.avatar_url });
          const updatedUser = { ...user, avatar_url: data.avatar_url };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          alert('Аватар обновлен!');
        } else {
          alert(data.error || 'Ошибка загрузки');
          setAvatarPreview(null);
        }

        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      alert('Ошибка загрузки');
      setAvatarUploading(false);
      setAvatarPreview(null);
    }
  };

  const quickAmounts = [10, 50, 100, 500];

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border animate-scale-in">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Личный кабинет</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon name="X" size={24} />
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-start gap-6">
              <div className="relative group cursor-pointer" onClick={isOwnProfile ? handleAvatarSelect : undefined}>
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarPreview || user.avatar_url} />
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(user.username)} text-white text-3xl font-bold`}>
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {avatarUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      <Icon name="Camera" size={28} className="text-white" />
                    )}
                  </div>
                )}
              </div>

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
              <Card className="bg-gradient-to-br from-green-800/10 to-green-900/10 border-green-800/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
                      <Icon name="Wallet" size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Баланс</p>
                      <p className={`text-3xl font-bold transition-all duration-300 ${isBalanceChanging ? 'scale-110 text-green-400' : 'scale-100'}`}>
                        {Number(animatedBalance).toFixed(2)} USDT
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowTopUpDialog(true)}
                    className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
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
              className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
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
              Откроется окно с адресом для перевода USDT
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCryptoDialog} onOpenChange={setShowCryptoDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Перевод USDT</DialogTitle>
            <DialogDescription>
              Отправьте {cryptoPayment?.amount} USDT на адрес ниже
            </DialogDescription>
          </DialogHeader>

          {cryptoPayment && (
            <div className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-green-800/10 to-green-900/10 border-green-800/20">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Сумма</Label>
                      <p className="text-2xl font-bold">{cryptoPayment.amount} USDT</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Сеть</Label>
                      <p className="text-lg font-semibold text-green-400">{cryptoPayment.network}</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-md mt-4">
                    <QRCodeSVG 
                      value={cryptoPayment.wallet_address}
                      size={110}
                      level="M"
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">Адрес кошелька</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-background rounded text-sm break-all">
                      {cryptoPayment.wallet_address}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(cryptoPayment.wallet_address)}
                    >
                      <Icon name="Copy" size={16} />
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="AlertTriangle" size={18} className="text-yellow-400 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-yellow-400">Важно:</p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Отправляйте только USDT в сети {cryptoPayment.network}</li>
                      <li>• Перевод в другой сети приведёт к потере средств</li>
                      <li>• После отправки нажмите "Я отправил"</li>
                      <li>• Зачисление произойдёт после подтверждения</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConfirmPayment}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600"
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  <>
                    <Icon name="Check" size={18} className="mr-2" />
                    Я отправил USDT
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowCryptoDialog(false)}
                className="w-full"
              >
                Отменить
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserProfile;