import { useEffect, useCallback } from 'react';
import { User } from '@/types';
import { notificationsCache } from '@/utils/notificationsCache';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const CRYPTO_URL = 'https://functions.poehali.dev/8caa3b76-72e5-42b5-9415-91d1f9b05210';
const VERIFICATION_URL = 'https://functions.poehali.dev/e0d94580-497a-452f-9044-0ef1b2ff42c8';

interface UseUserActivityProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setNotificationsUnread: (count: number) => void;
  setMessagesUnread: (count: number) => void;
  setAdminNotificationsUnread?: (count: number) => void;
  showAdminToast?: (title: string, description: string) => void;
  showToast?: (title: string, description: string, className?: string, duration?: number) => void;
  onUserBlocked?: () => void;
}

export const useUserActivity = ({
  user,
  setUser,
  setNotificationsUnread,
  setMessagesUnread,
  setAdminNotificationsUnread,
  showAdminToast,
  showToast,
  onUserBlocked
}: UseUserActivityProps) => {
  
  // Обновление активности пользователя (дебаунс 2 минуты)
  const updateActivity = useCallback(() => {
    if (!user) return;
    
    const lastActivity = sessionStorage.getItem('lastActivityUpdate');
    const now = Date.now();
    if (lastActivity && now - parseInt(lastActivity) < 120000) return;
    
    fetch(AUTH_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString()
      },
      body: JSON.stringify({ action: 'update_activity' })
    }).catch(() => {});
    
    sessionStorage.setItem('lastActivityUpdate', now.toString());
  }, [user]);

  // Проверка непрочитанных уведомлений с кэшированием
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    const counts = await notificationsCache.getCounts(user.id, user.role);
    if (counts) {
      setNotificationsUnread(counts.notifications);
      setMessagesUnread(counts.messages);
      
      if (counts.adminNotifications !== undefined && setAdminNotificationsUnread) {
        const prevCountStr = sessionStorage.getItem('prevAdminNotifCount');
        const newCount = counts.adminNotifications;
        
        setAdminNotificationsUnread(newCount);
        
        if (prevCountStr !== null) {
          const prevCount = parseInt(prevCountStr);
          if (newCount > prevCount && showAdminToast) {
            const diff = newCount - prevCount;
            showAdminToast(
              '🔔 Новые уведомления администратора',
              `Появилось ${diff} ${diff === 1 ? 'новое уведомление' : 'новых уведомления'} требующих внимания`
            );
            
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5a');
            audio.volume = 0.4;
            audio.play().catch(() => {});
          }
        }
        
        sessionStorage.setItem('prevAdminNotifCount', newCount.toString());
      }
    }
  }, [user, setNotificationsUnread, setMessagesUnread, setAdminNotificationsUnread, showAdminToast]);

  // Проверка баланса и статуса блокировки
  const checkBalanceUpdates = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ action: 'get_user' })
      });
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.success && data.user) {
        // Проверка блокировки
        if (data.user.is_blocked) {
          localStorage.removeItem('user');
          setUser(null);
          if (showToast) {
            showToast(
              '🚫 Аккаунт заблокирован',
              'Ваш аккаунт был заблокирован администратором',
              'bg-red-500/10 border-red-500/30 text-foreground',
              10000
            );
          }
          if (onUserBlocked) {
            onUserBlocked();
          }
          return;
        }
        
        const currentBalance = user.balance || 0;
        if (data.user.balance !== currentBalance) {
          const updatedUser = { ...user, balance: data.user.balance };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          const difference = data.user.balance - currentBalance;
          if (showToast && Math.abs(difference) >= 0.01) {
            const isIncrease = difference > 0;
            showToast(
              isIncrease ? '💰 Баланс пополнен' : '💸 Баланс изменён',
              `${isIncrease ? '+' : ''}${difference.toFixed(2)} USDT. Новый баланс: ${data.user.balance.toFixed(2)} USDT`,
              isIncrease ? 'bg-green-500/10 border-green-500/30 text-foreground' : 'bg-orange-500/10 border-orange-500/30 text-foreground',
              5000
            );
          }
        }
      }
    } catch (error) {
      // Silently handle connection errors
    }
  }, [user, setUser, showToast, onUserBlocked]);

  // Проверка статуса верификации
  const checkVerificationStatus = useCallback(async () => {
    if (!user) return;
    
    const lastCheck = sessionStorage.getItem(`verification_check_${user.id}`);
    const now = Date.now();
    if (lastCheck && now - parseInt(lastCheck) < 300000) return; // Не чаще раза в 5 минут
    
    try {
      const response = await fetch(VERIFICATION_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ 
          action: 'check_verification_status',
          user_id: user.id 
        })
      });

      if (!response.ok) return;
      const data = await response.json();
      
      if (data.verification_status === 'approved' && !user.is_verified) {
        const updatedUser = { ...user, is_verified: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (showToast) {
          showToast(
            '✅ Верификация одобрена!',
            'Ваша заявка на верификацию одобрена. Теперь рядом с вашим ником отображается значок верификации.',
            'bg-green-500/10 border-green-500/30 text-foreground',
            8000
          );
          
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5a');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        }
      }
      
      sessionStorage.setItem(`verification_check_${user.id}`, now.toString());
    } catch (error) {
      // Silently handle connection errors
    }
  }, [user, setUser, showToast]);

  useEffect(() => {
    if (!user) return;

    // Начальная загрузка при входе
    updateActivity();
    fetchUnreadCount();
    checkBalanceUpdates();
    checkVerificationStatus();

    // Слушаем события пользователя для обновления активности (с дебаунсом)
    let activityTimeout: NodeJS.Timeout;
    const handleUserActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => updateActivity(), 5000);
    };

    // Проверяем данные при возвращении на вкладку
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
        checkBalanceUpdates();
        checkVerificationStatus();
      }
    };

    // Проверяем при фокусе окна
    const handleFocus = () => {
      fetchUnreadCount();
      checkBalanceUpdates();
    };

    // События пользователя
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(activityTimeout);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, updateActivity, fetchUnreadCount, checkBalanceUpdates, checkVerificationStatus]);

  // Возвращаем методы для явного вызова из компонентов
  return {
    updateActivity,
    fetchUnreadCount,
    checkBalanceUpdates,
    checkVerificationStatus
  };
};