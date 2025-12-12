import { User } from '@/types';
import { useNavigate } from 'react-router-dom';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface IndexHandlersProps {
  user: User | null;
  setUser: (user: User | null) => void;
  authMode: 'login' | 'register';
  setAuthDialogOpen: (open: boolean) => void;
  setSelectedTopic: (topic: any) => void;
  setSelectedUserId: (id: number | null) => void;
  setShowUserProfile: (show: boolean) => void;
  setMessageRecipientId: (id: number | null) => void;
  setShowMessagesPanel: (show: boolean) => void;
  setActiveView: (view: 'plugins' | 'forum') => void;
  setActiveCategory: (category: string) => void;
  toast: any;
}

export const useIndexHandlers = ({
  user,
  setUser,
  authMode,
  setAuthDialogOpen,
  setSelectedTopic,
  setSelectedUserId,
  setShowUserProfile,
  setMessageRecipientId,
  setShowMessagesPanel,
  setActiveView,
  setActiveCategory,
  toast
}: IndexHandlersProps) => {
  const navigate = useNavigate();
  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          username: formData.get('username'),
          email: authMode === 'register' ? formData.get('email') : undefined,
          password: formData.get('password'),
          referral_code: authMode === 'register' ? formData.get('referral_code') : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setAuthDialogOpen(false);
        toast({
          title: 'Успешно',
          description: authMode === 'login' ? 'Вы вошли в систему' : 'Регистрация успешно завершена'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка авторизации',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Вы точно хотите выйти из аккаунта?');
    if (confirmed) {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      toast({
        title: 'Выход выполнен',
        description: 'Вы вышли из аккаунта'
      });
      navigate('/auth');
    }
  };

  const handleUpdateProfile = async (profileData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleTopUpBalance = async (amount: number) => {
    if (!user) return;
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'topup_balance',
          amount: amount
        })
      });
      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...user, balance: data.new_balance };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Ошибка пополнения баланса:', error);
      throw error;
    }
  };

  const refreshUserBalance = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${AUTH_URL}?action=get_balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'get_balance'
        })
      });
      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...user, balance: data.balance };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Ошибка обновления баланса:', error);
    }
  };

  const handleCategoryChange = (category: string, view: 'plugins' | 'forum') => {
    setActiveView(view);
    localStorage.setItem('activeView', view);
    if (view === 'plugins') {
      setActiveCategory(category);
      localStorage.setItem('activeCategory', category);
    }
    setSelectedTopic(null);
    localStorage.removeItem('selectedTopicId');
    window.scrollTo(0, 0);
  };

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleSendMessage = (recipientId: number) => {
    setMessageRecipientId(recipientId);
    setShowMessagesPanel(true);
  };

  const handleAuthDialogAttemptClose = () => {
    if (!user) {
      toast({
        title: '🔒 Требуется авторизация',
        description: 'Платформу могут использовать только авторизованные пользователи. Пожалуйста, войдите или зарегистрируйтесь для продолжения работы.',
        variant: 'destructive',
        duration: 6000,
        className: 'bg-red-500/10 border-red-500/30'
      });
    }
  };

  return {
    handleAuth,
    handleLogout,
    handleUpdateProfile,
    handleTopUpBalance,
    refreshUserBalance,
    handleCategoryChange,
    handleUserClick,
    handleSendMessage,
    handleAuthDialogAttemptClose
  };
};