import { User, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect, useRef } from 'react';
import { UserProfileHeader } from '@/components/UserProfile/UserProfileHeader';
import { UserProfileTabs } from '@/components/UserProfile/UserProfileTabs';
import { TopUpDialog } from '@/components/UserProfile/TopUpDialog';
import { CryptoPaymentDialog } from '@/components/UserProfile/CryptoPaymentDialog';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [animatedBalance, setAnimatedBalance] = useState(Number(user.balance) || 0);
  const [isBalanceChanging, setIsBalanceChanging] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [showCryptoDialog, setShowCryptoDialog] = useState(false);
  const [cryptoPayment, setCryptoPayment] = useState<any>(null);
  const [paymentNetwork, setPaymentNetwork] = useState('TRC20');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<string>('');
  const [checkAttempt, setCheckAttempt] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOwnProfile && activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, isOwnProfile]);

  useEffect(() => {
    const currentBalance = Number(user.balance) || 0;
    if (currentBalance !== animatedBalance) {
      setIsBalanceChanging(true);
      const duration = 800;
      const steps = 30;
      const stepValue = (currentBalance - animatedBalance) / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setAnimatedBalance(currentBalance);
          clearInterval(timer);
          setTimeout(() => setIsBalanceChanging(false), 300);
        } else {
          setAnimatedBalance(prev => prev + stepValue);
        }
      }, duration / steps);

      if (isOwnProfile && activeTab === 'transactions') {
        fetchTransactions();
      }

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
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive'
      });
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
        toast({
          title: 'Ошибка',
          description: 'Ошибка создания платежа',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка создания платежа:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка создания платежа',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!cryptoPayment) return;
    
    setIsLoading(true);
    setCheckingStatus('Начинаем поиск транзакции в блокчейне...');
    setCheckAttempt(0);
    let checkAttempts = 0;
    const maxAttempts = 60;
    
    const checkPayment = async (): Promise<boolean> => {
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
          const oldBalance = Number(user.balance) || 0;
          const newBalance = data.new_balance;
          const addedAmount = newBalance - oldBalance;
          
          if (onTopUpBalance) {
            const updatedUser = { ...user, balance: data.new_balance };
            Object.assign(user, updatedUser);
          }
          setCheckingStatus('Платёж подтверждён! Баланс пополнен.');
          
          toast({
            title: '💰 Баланс пополнен!',
            description: `Зачислено +${addedAmount.toFixed(2)} ₽. Новый баланс: ${newBalance.toFixed(2)} ₽`
          });
          
          setTimeout(() => {
            setShowCryptoDialog(false);
            setCryptoPayment(null);
            setCheckingStatus('');
            setCheckAttempt(0);
          }, 2000);
          if (activeTab === 'transactions') {
            fetchTransactions();
          }
          return true;
        }
        
        if (data.waiting && checkAttempts < maxAttempts) {
          checkAttempts++;
          setCheckAttempt(checkAttempts);
          setCheckingStatus(`Ищем транзакцию в блокчейне... Попытка ${checkAttempts}/${maxAttempts}`);
          
          await new Promise(resolve => setTimeout(resolve, 30000));
          return await checkPayment();
        }
        
        setCheckingStatus('Ошибка: ' + (data.message || 'Транзакция не найдена'));
        toast({
          title: 'Ошибка',
          description: data.message || 'Транзакция не найдена. Проверьте данные и попробуйте позже.',
          variant: 'destructive'
        });
        return false;
        
      } catch (error) {
        console.error('Ошибка проверки платежа:', error);
        setCheckingStatus('Ошибка проверки платежа');
        toast({
          title: 'Ошибка',
          description: 'Ошибка проверки платежа',
          variant: 'destructive'
        });
        return false;
      }
    };
    
    await checkPayment();
    setIsLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Успешно',
        description: 'Скопировано в буфер обмена'
      });
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
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
          title: 'Успешно',
          description: 'Скопировано в буфер обмена'
        });
      } catch (err) {
        console.error('Ошибка копирования:', err);
        toast({
          title: 'Ошибка',
          description: 'Не удалось скопировать',
          variant: 'destructive'
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handleAvatarSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Выбран файл:', file.name, file.type, file.size);

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Выберите изображение',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 5 МБ',
        variant: 'destructive'
      });
      return;
    }

    console.log('Начинаем загрузку аватара...');
    setAvatarUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        console.log('Файл прочитан, размер base64:', base64.length);
        setAvatarPreview(base64);

        console.log('Отправляем запрос на сервер...');
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

        console.log('Получен ответ, статус:', response.status);
        const data = await response.json();
        console.log('Данные ответа:', data);

        if (data.success) {
          const updatedUser = { ...user, avatar_url: data.avatar_url };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          Object.assign(user, updatedUser);
          
          if (onUpdateProfile) {
            onUpdateProfile({ avatar_url: data.avatar_url });
          }
          
          toast({
            title: 'Успешно',
            description: 'Аватар обновлен!'
          });
          
          window.location.reload();
        } else {
          console.error('Ошибка ответа:', data);
          toast({
            title: 'Ошибка',
            description: data.error || data.details || 'Ошибка загрузки',
            variant: 'destructive'
          });
          setAvatarPreview(null);
        }

        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка загрузки аватара',
        variant: 'destructive'
      });
      setAvatarUploading(false);
      setAvatarPreview(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
        <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-md border-border/50 shadow-2xl animate-scale-in rounded-2xl sm:rounded-3xl">
          <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6">
            {isOwnProfile ? (
              <div className="relative flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                    👤 Личный кабинет
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Управляйте своим профилем и балансом</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-xl hover:bg-muted/80 transition-all hover:scale-110 active:scale-90">
                  <Icon name="X" size={24} />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose} 
                  className="absolute top-0 right-0 z-10 h-10 w-10 rounded-xl hover:bg-muted/80 transition-all hover:scale-110 active:scale-90"
                >
                  <Icon name="X" size={24} />
                </Button>
              </div>
            )}

            <UserProfileHeader
              user={user}
              isOwnProfile={isOwnProfile}
              animatedBalance={animatedBalance}
              isBalanceChanging={isBalanceChanging}
              avatarPreview={avatarPreview}
              avatarUploading={avatarUploading}
              fileInputRef={fileInputRef}
              onAvatarSelect={handleAvatarSelect}
              onFileChange={handleFileChange}
              onShowTopUpDialog={() => setShowTopUpDialog(true)}
              onShowWithdrawalDialog={() => setShowWithdrawalDialog(true)}
            />

            <UserProfileTabs
              user={user}
              isOwnProfile={isOwnProfile}
              activeTab={activeTab}
              transactions={transactions}
              transactionsLoading={transactionsLoading}
              onTabChange={setActiveTab}
              onUpdateProfile={onUpdateProfile}
              showWithdrawalDialog={showWithdrawalDialog}
              onCloseWithdrawalDialog={() => setShowWithdrawalDialog(false)}
            />
          </div>
        </Card>
      </div>

      <TopUpDialog
        open={showTopUpDialog}
        isLoading={isLoading}
        topUpAmount={topUpAmount}
        onOpenChange={setShowTopUpDialog}
        onAmountChange={setTopUpAmount}
        onTopUp={handleTopUp}
      />

      <CryptoPaymentDialog
        open={showCryptoDialog}
        isLoading={isLoading}
        cryptoPayment={cryptoPayment}
        checkingStatus={checkingStatus}
        checkAttempt={checkAttempt}
        onOpenChange={setShowCryptoDialog}
        onConfirmPayment={handleConfirmPayment}
        onCopyToClipboard={copyToClipboard}
      />
    </>
  );
};

export default UserProfile;