import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';

export const useAdminBalance = (currentUserId: number, fetchUsers: () => void) => {
  const { toast } = useToast();
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceAction, setBalanceAction] = useState<'add' | 'subtract'>('add');
  const [balanceUsername, setBalanceUsername] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showBtcBalanceDialog, setShowBtcBalanceDialog] = useState(false);
  const [btcBalanceUserId, setBtcBalanceUserId] = useState<number>(0);
  const [btcBalanceUsername, setBtcBalanceUsername] = useState('');
  const [btcBalanceAmount, setBtcBalanceAmount] = useState(0);
  const [btcBalanceLoading, setBtcBalanceLoading] = useState(false);

  const handleAddBalance = async () => {
    if (!balanceUsername || !balanceAmount) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive'
      });
      return;
    }

    setBalanceLoading(true);
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: balanceAction === 'add' ? 'add_balance' : 'subtract_balance',
          username: balanceUsername,
          amount: parseFloat(balanceAmount)
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: balanceAction === 'add' 
            ? `Начислено ${balanceAmount} USDT пользователю ${balanceUsername}`
            : `Списано ${balanceAmount} USDT у пользователя ${balanceUsername}`
        });
        setShowBalanceDialog(false);
        setBalanceUsername('');
        setBalanceAmount('');
        fetchUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка выполнения операции',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка управления балансом:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка выполнения операции',
        variant: 'destructive'
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleManageBtc = (userId: number, username: string, currentBalance: number) => {
    setBtcBalanceUserId(userId);
    setBtcBalanceUsername(username);
    setBtcBalanceAmount(currentBalance);
    setShowBtcBalanceDialog(true);
  };

  const handleBtcBalanceSubmit = async (action: 'add' | 'subtract', amount: number) => {
    setBtcBalanceLoading(true);
    try {
      const finalAmount = action === 'subtract' ? -amount : amount;
      
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'update_btc_balance',
          user_id: btcBalanceUserId,
          amount: finalAmount
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: action === 'add' 
            ? `Начислено ${amount} BTC пользователю ${btcBalanceUsername}`
            : `Списано ${amount} BTC у пользователя ${btcBalanceUsername}`
        });
        setShowBtcBalanceDialog(false);
        fetchUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка выполнения операции',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка управления BTC:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка выполнения операции',
        variant: 'destructive'
      });
    } finally {
      setBtcBalanceLoading(false);
    }
  };

  return {
    showBalanceDialog,
    setShowBalanceDialog,
    balanceAction,
    setBalanceAction,
    balanceUsername,
    setBalanceUsername,
    balanceAmount,
    setBalanceAmount,
    balanceLoading,
    handleAddBalance,
    showBtcBalanceDialog,
    setShowBtcBalanceDialog,
    btcBalanceUserId,
    btcBalanceUsername,
    btcBalanceAmount,
    btcBalanceLoading,
    handleManageBtc,
    handleBtcBalanceSubmit
  };
};
