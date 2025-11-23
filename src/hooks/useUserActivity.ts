import { useEffect } from 'react';
import { User } from '@/types';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';
const CRYPTO_URL = 'https://functions.poehali.dev/8caa3b76-72e5-42b5-9415-91d1f9b05210';
const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';
const VERIFICATION_URL = 'https://functions.poehali.dev/e0d94580-497a-452f-9044-0ef1b2ff42c8';

interface UseUserActivityProps {
  user: User | null;
  setUser: (user: User) => void;
  setNotificationsUnread: (count: number) => void;
  setMessagesUnread: (count: number) => void;
  setAdminNotificationsUnread?: (count: number) => void;
  showAdminToast?: (title: string, description: string) => void;
  showToast?: (title: string, description: string, className?: string, duration?: number) => void;
}

export const useUserActivity = ({
  user,
  setUser,
  setNotificationsUnread,
  setMessagesUnread,
  setAdminNotificationsUnread,
  showAdminToast,
  showToast
}: UseUserActivityProps) => {
  useEffect(() => {
    if (user) {
      const updateActivity = () => {
        fetch(AUTH_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify({ action: 'update_activity' })
        }).catch(() => {});
      };

      const fetchUnreadCount = async () => {
        try {
          const requests = [
            fetch(`${NOTIFICATIONS_URL}?action=notifications`, {
              headers: { 'X-User-Id': user.id.toString() }
            }),
            fetch(`${NOTIFICATIONS_URL}?action=messages`, {
              headers: { 'X-User-Id': user.id.toString() }
            })
          ];

          if (user.role === 'admin' && setAdminNotificationsUnread) {
            requests.push(
              fetch(`${ADMIN_URL}?action=admin_notifications_unread_count`, {
                headers: { 'X-User-Id': user.id.toString() }
              })
            );
          }

          const responses = await Promise.all(requests);
          const [notifRes, msgRes, adminNotifRes] = responses;

          if (notifRes.ok && msgRes.ok) {
            const notifData = await notifRes.json();
            const msgData = await msgRes.json();
            setNotificationsUnread(notifData.unread_count || 0);
            setMessagesUnread(msgData.unread_count || 0);

            if (adminNotifRes && adminNotifRes.ok && setAdminNotificationsUnread) {
              const adminNotifData = await adminNotifRes.json();
              const prevCount = parseInt(sessionStorage.getItem('prevAdminNotifCount') || '0');
              const newCount = adminNotifData.unread_count || 0;
              
              setAdminNotificationsUnread(newCount);
              
              if (newCount > prevCount && prevCount > 0 && showAdminToast) {
                const diff = newCount - prevCount;
                showAdminToast(
                  '🔔 Новые уведомления администратора',
                  `Появилось ${diff} ${diff === 1 ? 'новое уведомление' : 'новых уведомления'} требующих внимания`
                );
                
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5a');
                audio.volume = 0.4;
                audio.play().catch(() => {});
              }
              
              sessionStorage.setItem('prevAdminNotifCount', newCount.toString());
            }
          }
        } catch (error) {
          // Silently handle connection errors for background task
        }
      };

      const checkBalanceUpdates = async () => {
        try {
          const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-User-Id': user.id.toString()
            },
            body: JSON.stringify({ action: 'get_balance' })
          });
          if (!response.ok) return;
          const data = await response.json();
          if (data.success && data.balance !== undefined) {
            const currentBalance = user.balance || 0;
            if (data.balance !== currentBalance) {
              const updatedUser = { ...user, balance: data.balance };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          }
        } catch (error) {
          // Silently handle connection errors for background task
        }
      };

      const checkPendingPayments = async () => {
        try {
          const response = await fetch(`${CRYPTO_URL}?action=check_pending`, {
            headers: { 'X-User-Id': user.id.toString() }
          });
          if (!response.ok) return;
          const data = await response.json();
          if (data.success && data.count > 0) {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
              const currentUser = JSON.parse(savedUser);
              const totalAmount = data.auto_confirmed.reduce((sum: number, p: any) => sum + p.amount, 0);
              const updatedBalance = (currentUser.balance || 0) + totalAmount;
              const updatedUser = { ...currentUser, balance: updatedBalance };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              
              if (totalAmount > 0) {
                if (Notification.permission === 'granted') {
                  new Notification('💰 Баланс пополнен!', {
                    body: `Зачислено ${totalAmount.toFixed(2)} USDT`,
                    icon: '/favicon.ico'
                  });
                }
                
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5a');
                audio.volume = 0.3;
                audio.play().catch(() => {});
              }
            }
          }
        } catch (error) {
          // Silently handle connection errors for background task
        }
      };

      const checkVerificationStatus = async () => {
        try {
          const response = await fetch(`${VERIFICATION_URL}?action=status`, {
            headers: { 'X-User-Id': user.id.toString() }
          });
          if (!response.ok) return;
          const data = await response.json();
          
          if (data.is_verified !== user.is_verified) {
            const updatedUser = { ...user, is_verified: data.is_verified };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            if (data.is_verified && showToast) {
              showToast(
                '✅ Поздравляем!',
                'Ваша заявка на верификацию одобрена. Теперь рядом с вашим ником отображается значок верификации.',
                'bg-green-500/10 border-green-500/30 text-foreground',
                8000
              );
              
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5aFApBmeHyvWwhBTGG0fPTgjMGHW7A7+OZSA0OVajk7q5a');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            }
          }
        } catch (error) {
          // Silently handle connection errors for background task
        }
      };

      updateActivity();
      fetchUnreadCount();
      checkBalanceUpdates();
      checkPendingPayments();
      checkVerificationStatus();
      
      const activityInterval = setInterval(updateActivity, 60 * 1000);
      const unreadInterval = setInterval(fetchUnreadCount, 30 * 1000);
      const balanceInterval = setInterval(checkBalanceUpdates, 5 * 1000);
      const paymentsInterval = setInterval(checkPendingPayments, 30 * 1000);
      const verificationInterval = setInterval(checkVerificationStatus, 15 * 1000);
      
      return () => {
        clearInterval(activityInterval);
        clearInterval(unreadInterval);
        clearInterval(balanceInterval);
        clearInterval(paymentsInterval);
        clearInterval(verificationInterval);
      };
    }
  }, [user]);
};