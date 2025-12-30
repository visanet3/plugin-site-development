import { useState } from 'react';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FlashBtcHeader } from './FlashBtc/FlashBtcHeader';
import { FlashBtcInfo } from './FlashBtc/FlashBtcInfo';
import { FlashBtcPackages, type Package } from './FlashBtc/FlashBtcPackages';
import { FlashBtcPurchaseDialog } from './FlashBtc/FlashBtcPurchaseDialog';
import { Waves } from '@/components/ui/wave-background';
import { triggerUserSync } from '@/utils/userSync';

interface FlashBtcShopProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

const FlashBtcShop = ({ user, onShowAuthDialog, onRefreshUserBalance }: FlashBtcShopProps) => {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const packages: Package[] = [
    {
      id: 1,
      amount: 1,
      price: 34100,
      discount: '65%',
      color: 'from-orange-600 to-orange-800',
      borderColor: 'border-orange-500/30',
      icon: 'Package',
      popular: false,
      soldOut: false
    },
    {
      id: 2,
      amount: 2,
      price: 54700,
      discount: '72%',
      color: 'from-amber-600 to-amber-800',
      borderColor: 'border-amber-500/30',
      icon: 'Boxes',
      popular: true,
      soldOut: false
    },
    {
      id: 3,
      amount: 10,
      price: 238000,
      discount: '76%',
      color: 'from-yellow-600 to-yellow-800',
      borderColor: 'border-yellow-500/30',
      icon: 'Warehouse',
      popular: false,
      soldOut: false
    },
    {
      id: 4,
      amount: 100,
      price: 1420000,
      discount: '86%',
      color: 'from-red-600 to-red-800',
      borderColor: 'border-red-500/30',
      icon: 'Building',
      popular: false,
      soldOut: false
    }
  ];

  const handleTestPurchase = () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    const testPackage: Package = {
      id: 0,
      amount: 0.001,
      price: 100,
      discount: '99.9%',
      color: 'from-orange-600 to-orange-800',
      borderColor: 'border-orange-500/30',
      icon: 'TestTube',
      popular: false
    };

    setSelectedPackage(testPackage);
    setShowPurchaseDialog(true);
  };

  const handlePurchase = (pkg: Package) => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    setSelectedPackage(pkg);
    setShowPurchaseDialog(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage || !walletAddress.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите адрес Bitcoin кошелька',
        variant: 'destructive'
      });
      return;
    }

    const btcAddressRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;
    if (!btcAddressRegex.test(walletAddress)) {
      toast({
        title: 'Ошибка',
        description: 'Неверный формат Bitcoin адреса. Проверьте правильность ввода',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо авторизоваться',
        variant: 'destructive'
      });
      return;
    }

    const userBalance = user.balance || 0;
    if (userBalance < selectedPackage.price) {
      toast({
        title: 'Недостаточно средств',
        description: `На вашем балансе ${userBalance.toLocaleString('ru-RU')} USDT. Для покупки необходимо ${selectedPackage.price.toLocaleString('ru-RU')} USDT.`,
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('https://functions.poehali.dev/66bb459b-0c13-41ae-b1cf-c50711528da2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          packageId: selectedPackage.id,
          amount: selectedPackage.amount,
          price: selectedPackage.price,
          walletAddress: walletAddress
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании заказа');
      }
      
      toast({
        title: 'Покупка успешна',
        description: `Вы приобрели ${selectedPackage.amount} Flash BTC. Токены придут в течение 1-3 минут.`
      });

      // Обновляем баланс через 5 секунд после успешной покупки
      setTimeout(() => {
        triggerUserSync();
        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
      }, 5000);

      setShowPurchaseDialog(false);
      setWalletAddress('');
      setSelectedPackage(null);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать заказ. Попробуйте позже.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseDialog = () => {
    setShowPurchaseDialog(false);
    setWalletAddress('');
    setSelectedPackage(null);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in px-2 sm:px-0">
      {/* Wave background - только для desktop */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <Waves 
          className="w-full h-full" 
          strokeColor="#ff880015" 
          backgroundColor="transparent"
          pointerSize={0.3}
        />
      </div>

      {/* Content поверх эффекта */}
      <div className="relative" style={{ zIndex: 1 }}>
        <FlashBtcHeader onTestPurchase={handleTestPurchase} />
      
      <FlashBtcInfo />

      <FlashBtcPackages 
        packages={packages}
        onPurchase={handlePurchase}
        selectedPackageId={selectedPackage?.id}
      />

        <FlashBtcPurchaseDialog
          open={showPurchaseDialog}
          selectedPackage={selectedPackage}
          walletAddress={walletAddress}
          isProcessing={isProcessing}
          onOpenChange={handleCloseDialog}
          onWalletAddressChange={setWalletAddress}
          onConfirmPurchase={handleConfirmPurchase}
        />
      </div>
    </div>
  );
};

export default FlashBtcShop;