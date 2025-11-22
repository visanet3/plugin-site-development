import { User, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect, useRef } from 'react';
import { UserProfileHeader } from '@/components/UserProfile/UserProfileHeader';
import { UserProfileTabs } from '@/components/UserProfile/UserProfileTabs';
import { TopUpDialog } from '@/components/UserProfile/TopUpDialog';
import { CryptoPaymentDialog } from '@/components/UserProfile/CryptoPaymentDialog';

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
            />

            <UserProfileTabs
              user={user}
              isOwnProfile={isOwnProfile}
              activeTab={activeTab}
              transactions={transactions}
              transactionsLoading={transactionsLoading}
              onTabChange={setActiveTab}
              onUpdateProfile={onUpdateProfile}
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
        onOpenChange={setShowCryptoDialog}
        onConfirmPayment={handleConfirmPayment}
        onCopyToClipboard={copyToClipboard}
      />
    </>
  );
};

export default UserProfile;
