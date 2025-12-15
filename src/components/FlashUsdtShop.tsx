import { useState } from 'react';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { triggerUserSync } from '@/utils/userSync';
import { FlashUsdtHeader } from './FlashUsdt/FlashUsdtHeader';
import { FlashUsdtInfo } from './FlashUsdt/FlashUsdtInfo';
import { FlashUsdtPackages, type Package } from './FlashUsdt/FlashUsdtPackages';
import { FlashUsdtPurchaseDialog } from './FlashUsdt/FlashUsdtPurchaseDialog';
import { Waves } from '@/components/ui/wave-background';
import VipTonPurchase from '@/components/VipTonPurchase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FlashUsdtShopProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

const FlashUsdtShop = ({ user, onShowAuthDialog, onRefreshUserBalance }: FlashUsdtShopProps) => {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVipDialog, setShowVipDialog] = useState(false);

  const userHasVip = user?.vip_until ? new Date(user.vip_until) > new Date() : false;

  const handleBuyVip = () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }
    setShowVipDialog(true);
  };

  const packages: Package[] = [
    {
      id: 1,
      amount: 100000,
      price: 25950,
      discount: '74.1%',
      color: 'from-blue-600 to-blue-800',
      borderColor: 'border-blue-500/30',
      icon: 'Package',
      popular: false,
      soldOut: true,
      soldOutDate: '15.12.2025, 18:33:33'
    },
    {
      id: 2,
      amount: 500000,
      price: 116400,
      discount: '78.7%',
      color: 'from-purple-600 to-purple-800',
      borderColor: 'border-purple-500/30',
      icon: 'Boxes',
      popular: true,
      vipOnly: true
    },
    {
      id: 3,
      amount: 1000000,
      price: 190000,
      discount: '81%',
      color: 'from-orange-600 to-orange-800',
      borderColor: 'border-orange-500/30',
      icon: 'Warehouse',
      popular: false
    },
    {
      id: 4,
      amount: 5000000,
      price: 760000,
      discount: '84.8%',
      color: 'from-red-600 to-red-800',
      borderColor: 'border-red-500/30',
      icon: 'Building',
      popular: false
    }
  ];

  const handleTestPurchase = () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    const testPackage: Package = {
      id: 0,
      amount: 10,
      price: 100,
      discount: '99%',
      color: 'from-blue-600 to-blue-800',
      borderColor: 'border-blue-500/30',
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
        description: 'Введите адрес кошелька TRC20',
        variant: 'destructive'
      });
      return;
    }

    if (!walletAddress.startsWith('T') || walletAddress.length !== 34) {
      toast({
        title: 'Ошибка',
        description: 'Неверный формат адреса TRC20. Адрес должен начинаться с "T" и содержать 34 символа',
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
      const response = await fetch('https://functions.poehali.dev/9d93686d-9a6f-47bc-85a8-7b7c28e4edd7', {
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
        description: `Вы приобрели ${selectedPackage.amount.toLocaleString('ru-RU')} Flash USDT. Токены придут в течение 1-3 минут.`
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
          strokeColor="#ffffff15" 
          backgroundColor="transparent"
          pointerSize={0.3}
        />
      </div>

      {/* Content поверх эффекта */}
      <div className="relative space-y-4 sm:space-y-6 md:space-y-8" style={{ zIndex: 1 }}>
        <FlashUsdtHeader onTestPurchase={handleTestPurchase} />
      
        <FlashUsdtInfo />

        <FlashUsdtPackages 
          packages={packages}
          onPurchase={handlePurchase}
          selectedPackageId={selectedPackage?.id}
          userHasVip={userHasVip}
          onBuyVip={handleBuyVip}
        />

      <FlashUsdtPurchaseDialog
        open={showPurchaseDialog}
        selectedPackage={selectedPackage}
        walletAddress={walletAddress}
        isProcessing={isProcessing}
        onOpenChange={handleCloseDialog}
        onWalletAddressChange={setWalletAddress}
        onConfirmPurchase={handleConfirmPurchase}
      />

      <Dialog open={showVipDialog} onOpenChange={setShowVipDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Покупка VIP статуса</DialogTitle>
          </DialogHeader>
          <VipTonPurchase user={user} onShowAuthDialog={onShowAuthDialog} />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default FlashUsdtShop;