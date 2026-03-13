import { useState, useEffect } from 'react';
import { User, ForumTopic } from '@/types';
import AdminPanelHeader from '@/components/admin/AdminPanelHeader';
import AdminPanelTabs from '@/components/admin/AdminPanelTabs';
import AdminPanelContent from '@/components/admin/AdminPanelContent';
import AdminBalanceDialog from '@/components/admin/AdminBalanceDialog';
import AdminBtcBalanceDialog from '@/components/admin/AdminBtcBalanceDialog';
import AdminTokenBalanceDialog from '@/components/admin/AdminTokenBalanceDialog';
import AdminTopicEditDialog from '@/components/admin/AdminTopicEditDialog';
import { useToast } from '@/hooks/use-toast';
import { AUTH_URL, FORUM_URL, ADMIN_URL, WITHDRAWAL_URL, CRYPTO_URL, FLASH_USDT_URL, SUPPORT_TICKETS_URL as TICKETS_URL, DEALS_URL } from '@/lib/api-urls';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
}

const AdminPanel = ({ currentUser, onClose }: AdminPanelProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [btcWithdrawals, setBtcWithdrawals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'topics' | 'disputes' | 'deposits' | 'withdrawals' | 'btc-withdrawals' | 'flash-usdt' | 'flash-btc' | 'tickets' | 'verification' | 'forum-categories' | 'deals' | 'withdrawal-control' | 'vip-ton' | 'exchange' | 'messages'>('users');
  const [deals, setDeals] = useState<any[]>([]);
  const [flashUsdtOrders, setFlashUsdtOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [editingTopic, setEditingTopic] = useState<ForumTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
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
  const [showTokenBalanceDialog, setShowTokenBalanceDialog] = useState(false);
  const [tokenBalanceUserId, setTokenBalanceUserId] = useState<number>(0);
  const [tokenBalanceUsername, setTokenBalanceUsername] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenCurrentBalance, setTokenCurrentBalance] = useState(0);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({
    balance_topup: 0,
    verification_request: 0,
    withdrawal_request: 0,
    escrow_dispute: 0
  });
  const [sectionCounts, setSectionCounts] = useState(() => {
    const saved = localStorage.getItem('admin_section_counts');
    return saved ? JSON.parse(saved) : {
      users: 0,
      topics: 0,
      disputes: 0,
      deposits: 0,
      withdrawals: 0,
      btcWithdrawals: 0,
      flashUsdt: 0,
      flashBtc: 0,
      tickets: 0,
      verification: 0,
      deals: 0
    };
  });
  const [readSections, setReadSections] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('admin_read_sections');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'topics') {
      fetchTopics();
    } else if (activeTab === 'disputes') {
      fetchDisputes();
    } else if (activeTab === 'withdrawals') {
      fetchWithdrawals();
    } else if (activeTab === 'deposits') {
      fetchDeposits();
    } else if (activeTab === 'flash-usdt') {
      fetchFlashUsdtOrders();
    } else if (activeTab === 'tickets') {
      fetchTickets();
    } else if (activeTab === 'btc-withdrawals') {
      fetchBtcWithdrawals();
    } else if (activeTab === 'deals') {
      fetchDeals();
    }
    
    markSectionAsRead(activeTab);
  }, [activeTab]);



  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchAdminNotifications(),
        fetchAllCounts()
      ]);
      setTimeout(() => setIsInitialLoad(false), 100);
    };
    
    loadInitialData();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${ADMIN_URL}?action=users`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch(FORUM_URL);
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Ошибка загрузки тем:', error);
    }
  };

  const fetchDisputes = async () => {
    try {
      setDisputes([]);
    } catch (error) {
      console.error('Ошибка загрузки споров:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch(`${WITHDRAWAL_URL}?action=all_withdrawals&status=all`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
    } catch (error) {
      console.error('Ошибка загрузки заявок на вывод:', error);
    }
  };

  const fetchDeposits = async () => {
    try {
      const response = await fetch(`${CRYPTO_URL}?action=all_deposits&status=all`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      setDeposits(data.deposits || []);
    } catch (error) {
      console.error('Ошибка загрузки пополнлений:', error);
    }
  };

  const fetchFlashUsdtOrders = async () => {
    try {
      const response = await fetch(`${FLASH_USDT_URL}?action=admin_orders`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      setFlashUsdtOrders(data.orders || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов Flash USDT:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${TICKETS_URL}?action=list`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки тикетов:', error);
      setTickets([]);
    }
  };

  const fetchBtcWithdrawals = async () => {
    try {
      const response = await fetch(`${AUTH_URL}?action=get_crypto_withdrawals`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setBtcWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки криптовыводов:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${DEALS_URL}?action=admin_all_deals`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setDeals(data.deals || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
    }
  };

  const fetchAllCounts = async () => {
    try {
      const [
        usersRes,
        topicsRes,
        disputesRes,
        withdrawalsRes,
        depositsRes,
        flashUsdtRes,
        btcWithdrawalsRes
      ] = await Promise.all([
        fetch(`${ADMIN_URL}?action=users`, { headers: { 'X-User-Id': currentUser.id.toString() } }),
        fetch(FORUM_URL),
        Promise.resolve({ json: async () => ({ deals: [] }) }),
        fetch(`${WITHDRAWAL_URL}?action=all_withdrawals&status=processing`, { headers: { 'X-User-Id': currentUser.id.toString() } }),
        fetch(`${CRYPTO_URL}?action=all_deposits&status=pending`, { headers: { 'X-User-Id': currentUser.id.toString() } }),
        fetch(`${FLASH_USDT_URL}?action=admin_orders`, { headers: { 'X-User-Id': currentUser.id.toString() } }),
        fetch(`${ADMIN_URL}?action=btc_withdrawals`, { headers: { 'X-User-Id': currentUser.id.toString() } })
      ]);

      const [usersData, topicsData, disputesData, withdrawalsData, depositsData, flashUsdtData, btcWithdrawalsData] = await Promise.all([
        usersRes.json(),
        topicsRes.json(),
        disputesRes.json(),
        withdrawalsRes.json(),
        depositsRes.json(),
        flashUsdtRes.json(),
        btcWithdrawalsRes.json()
      ]);

      const newUsers = (usersData.users || []).filter((u: any) => {
        const createdAt = new Date(u.created_at);
        return (Date.now() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
      }).length;

      const newTopics = (topicsData.topics || []).filter((t: any) => {
        const createdAt = new Date(t.created_at);
        return (Date.now() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
      }).length;

      const ticketsRes = await fetch(`${TICKETS_URL}?action=list`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const ticketsData = await ticketsRes.json();
      const openTicketsCount = ticketsData.success 
        ? (ticketsData.tickets || []).filter((t: any) => t.status === 'open').length 
        : 0;

      const dealsRes = await fetch(`${DEALS_URL}?action=admin_all_deals`, { headers: { 'X-User-Id': currentUser.id.toString() } });
      const dealsData = await dealsRes.json();
      const activeDealsCount = dealsData.success 
        ? (dealsData.deals || []).filter((d: any) => d.status === 'in_progress' || d.status === 'dispute').length
        : 0;

      const newCounts = {
        users: newUsers,
        topics: newTopics,
        disputes: (disputesData.deals || []).length,
        deposits: (depositsData.deposits || []).filter((d: any) => d.status === 'pending').length,
        withdrawals: (withdrawalsData.withdrawals || []).filter((w: any) => w.status === 'processing').length,
        btcWithdrawals: (btcWithdrawalsData.withdrawals || []).filter((w: any) => w.status === 'pending').length,
        flashUsdt: (flashUsdtData.orders || []).filter((o: any) => o.status === 'pending').length,
        tickets: openTicketsCount,
        verification: notificationCounts.verification_request,
        deals: activeDealsCount
      };

      const sectionsToUnread = new Set<string>();
      const sectionNames: Record<string, string> = {
        users: 'Новый пользователь',
        topics: 'Новая тема форума',
        deals: 'Новая сделка',
        disputes: 'Новый спор',
        deposits: 'Новое пополнение',
        withdrawals: 'Новая заявка на вывод USDT',
        btcWithdrawals: 'Новая заявка на вывод BTC',
        flashUsdt: 'Новый заказ Flash USDT',
        tickets: 'Новый тикет',
        verification: 'Новая заявка на верификацию'
      };

      Object.keys(newCounts).forEach(key => {
        const oldCount = sectionCounts[key as keyof typeof sectionCounts];
        const newCount = newCounts[key as keyof typeof newCounts];
        
        if (newCount > oldCount && oldCount > 0 && !isInitialLoad) {
          sectionsToUnread.add(key);
          
          const diff = newCount - oldCount;
          toast({
            title: '🔔 ' + sectionNames[key],
            description: diff === 1 ? `Появился новый элемент в разделе "${sectionNames[key]}"` : `Появилось ${diff} новых элементов`,
            duration: 5000
          });
        } else if (newCount > oldCount && !isInitialLoad) {
          sectionsToUnread.add(key);
        }
      });

      if (sectionsToUnread.size > 0) {
        setReadSections(prev => {
          const newSet = new Set(prev);
          sectionsToUnread.forEach(section => newSet.delete(section));
          localStorage.setItem('admin_read_sections', JSON.stringify([...newSet]));
          return newSet;
        });
      }

      localStorage.setItem('admin_section_counts', JSON.stringify(newCounts));
      setSectionCounts(newCounts);
    } catch (error) {
      console.error('Ошибка загрузки счётчиков:', error);
    }
  };

  const fetchAdminNotifications = async () => {
    try {
      const response = await fetch(`${ADMIN_URL}?action=admin_notifications`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      if (data.success) {
        const unreadNotifications = (data.notifications || []).filter(
          (notif: any) => !notif.is_read
        );
        
        const prevCount = adminNotifications.length;
        const newCount = unreadNotifications.length;
        
        if (newCount > prevCount && !isInitialLoad) {
          const newNotifs = unreadNotifications.slice(0, newCount - prevCount);
          newNotifs.forEach((notif: any) => {
            toast({
              title: notif.title,
              description: notif.message,
              duration: 6000
            });
          });
        }
        
        setAdminNotifications(unreadNotifications);
        
        const counts = {
          balance_topup: 0,
          verification_request: 0,
          withdrawal_request: 0,
          escrow_dispute: 0
        };
        
        unreadNotifications.forEach((notif: any) => {
          if (notif.type in counts) {
            counts[notif.type as keyof typeof counts]++;
          }
        });
        
        setNotificationCounts(counts);
      }
    } catch (error) {
      console.error('Ошибка загрузки админ-уведомлений:', error);
    }
  };

  const markNotificationsRead = async () => {
    try {
      await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'mark_admin_notifications_read'
        })
      });
      setAdminNotifications([]);
      fetchAdminNotifications();
    } catch (error) {
      console.error('Ошибка отметки админ-уведомлений:', error);
    }
  };

  const handleEditTopic = (topic: ForumTopic) => {
    setEditingTopic(topic);
    setEditTitle(topic.title);
    setEditContent(topic.content || '');
  };

  const handleSaveEdit = async () => {
    toast({
      title: 'Информация',
      description: 'Backend функция /admin не развернута из-за лимита функций (5/5). Для работы админ-панели необходимо увеличить лимит.'
    });
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!confirm('Удалить эту тему? Она будет скрыта для пользователей.')) return;
    
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'delete_topic',
          topic_id: topicId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchTopics();
        toast({
          title: 'Успешно',
          description: 'Тема удалена'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка удаления темы',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка удаления темы:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка удаления темы',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateViews = async (topicId: number, views: number) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'update_views',
          topic_id: topicId,
          views: views
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Количество просмотров обновлено'
        });
        fetchTopics();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить просмотры',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить просмотры',
        variant: 'destructive'
      });
    }
  };

  const handleBlockUser = async (userId: number, username: string) => {
    const reason = prompt(`Заблокировать пользователя ${username}?\nУкажите причину:`);
    if (!reason) return;
    
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'block_user',
          user_id: userId,
          reason: reason
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        toast({
          title: 'Успешно',
          description: 'Пользователь заблокирован'
        });
      }
    } catch (error) {
      console.error('Ошибка блокировки:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка блокировки',
        variant: 'destructive'
      });
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'unblock_user',
          user_id: userId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        toast({
          title: 'Успешно',
          description: 'Пользователь разблокирован'
        });
      }
    } catch (error) {
      console.error('Ошибка разблокировки:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка разблокировки',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    const confirmed = window.confirm(`Удалить пользователя ${username}? Это действие нельзя отменить!`);
    if (!confirmed) return;
    
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'delete_user',
          user_id: userId
        })
      });
      
      const data = await response.json();
      console.log('Delete user response:', data);
      if (data.success) {
        fetchUsers();
        toast({
          title: 'Успешно',
          description: 'Пользователь удалён'
        });
      } else {
        console.error('Delete user error:', data.error);
        toast({
          title: 'Ошибка удаления пользователя',
          description: data.error || 'Неизвестная ошибка',
          variant: 'destructive',
          duration: 10000
        });
      }
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка удаления пользователя',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTicketStatus = async (ticketId: number, status: 'open' | 'answered' | 'closed') => {
    try {
      const response = await fetch(TICKETS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'update_status',
          ticket_id: ticketId,
          status: status
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchTickets();
      }
    } catch (error) {
      console.error('Ошибка обновления статуса тикета:', error);
    }
  };

  const handleChangeForumRole = async (userId: number, forumRole: string) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'set_forum_role',
          user_id: userId,
          forum_role: forumRole
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        toast({
          title: 'Успешно',
          description: 'Роль обновлена'
        });
      }
    } catch (error) {
      console.error('Ошибка изменения роли:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка изменения роли',
        variant: 'destructive'
      });
    }
  };

  const handleManageBtc = (userId: number, username: string, currentBalance: number) => {
    setBtcBalanceUserId(userId);
    setBtcBalanceUsername(username);
    setBtcBalanceAmount(currentBalance);
    setShowBtcBalanceDialog(true);
  };

  const handleVerifyUser = async (userId: number, username: string) => {
    if (!confirm(`Вы уверены, что хотите верифицировать пользователя ${username}?`)) {
      return;
    }

    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'verify_user',
          user_id: userId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: `Пользователь ${username} верифицирован`
        });
        fetchUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка верификации',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка верификации:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    }
  };

  const handleBtcBalanceSubmit = async (action: 'add' | 'subtract', amount: number) => {
    setBtcBalanceLoading(true);
    try {
      const finalAmount = action === 'subtract' ? -amount : amount;
      
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
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

  const handleManageToken = (userId: number, username: string, symbol: string, currentBalance: number) => {
    setTokenBalanceUserId(userId);
    setTokenBalanceUsername(username);
    setTokenSymbol(symbol);
    setTokenCurrentBalance(currentBalance);
    setShowTokenBalanceDialog(true);
  };

  const downloadExchangeTransactions = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'get_crypto_transactions'
        })
      });
      
      const data = await response.json();
      if (data.success && data.transactions) {
        const csv = convertToCSV(data.transactions, [
          { key: 'id', label: 'ID' },
          { key: 'transaction_type', label: 'Тип' },
          { key: 'crypto_symbol', label: 'Криптовалюта' },
          { key: 'amount', label: 'Количество' },
          { key: 'price', label: 'Цена' },
          { key: 'total', label: 'Сумма USDT' },
          { key: 'wallet_address', label: 'Кошелёк' },
          { key: 'status', label: 'Статус' },
          { key: 'created_at', label: 'Дата' }
        ]);
        downloadCSVFile(csv, 'exchange_transactions.csv');
        toast({
          title: 'Готово',
          description: 'Файл со сделками скачан'
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось скачать данные',
        variant: 'destructive'
      });
    }
  };

  const viewUserExpenses = async (userId: number, username: string) => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'get_user_expenses',
          user_id: userId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        const expenses = data.expenses;
        const message = `
Пользователь: ${username}
Сделки в обменнике: ${expenses.exchange_transactions.length}

Последние сделки:
${expenses.exchange_transactions.slice(0, 5).map((tx: any) => 
  `- ${tx.type === 'buy' ? 'Покупка' : 'Продажа'} ${tx.amount} ${tx.crypto} за ${tx.total} USDT (${tx.date})`
).join('\n')}
        `.trim();
        
        alert(message);
      }
    } catch (error) {
      console.error('Ошибка загрузки расходов:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    }
  };

  const convertToCSV = (data: any[], columns: { key: string; label: string }[]) => {
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return '';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  const downloadCSVFile = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleTokenBalanceSubmit = async (action: 'add' | 'subtract', amount: number) => {
    try {
      const finalAmount = action === 'subtract' ? -amount : amount;
      
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'update_token_balance',
          user_id: tokenBalanceUserId,
          token_symbol: tokenSymbol,
          amount: finalAmount
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: action === 'add' 
            ? `Начислено ${amount} ${tokenSymbol} пользователю ${tokenBalanceUsername}`
            : `Списано ${amount} ${tokenSymbol} у пользователя ${tokenBalanceUsername}`
        });
        setShowTokenBalanceDialog(false);
        fetchUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка выполнения операции',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка управления токенами:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка выполнения операции',
        variant: 'destructive'
      });
    }
  };

  const handleAddBalance = async () => {
    const amount = parseFloat(balanceAmount);
    if (!balanceUsername.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите никнейм пользователя',
        variant: 'destructive'
      });
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
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
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: balanceAction === 'add' ? 'add_balance' : 'subtract_balance',
          username: balanceUsername.trim(),
          amount: amount
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: balanceAction === 'add' 
            ? `Баланс пользователя ${balanceUsername} пополнен на ${amount} USDT`
            : `С баланса пользователя ${balanceUsername} списано ${amount} USDT`
        });
        setShowBalanceDialog(false);
        setBalanceUsername('');
        setBalanceAmount('');
        setBalanceAction('add');
        fetchUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || `Ошибка ${balanceAction === 'add' ? 'пополнения' : 'списания'} баланса`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error(`Ошибка ${balanceAction === 'add' ? 'пополнения' : 'списания'} баланса:`, error);
      toast({
        title: 'Ошибка',
        description: `Ошибка ${balanceAction === 'add' ? 'пополнения' : 'списания'} баланса`,
        variant: 'destructive'
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  const getVisibleCount = (section: string, count: number) => {
    return readSections.has(section) ? 0 : count;
  };

  const markSectionAsRead = (section: string) => {
    setReadSections(prev => {
      const newSet = new Set([...prev, section]);
      localStorage.setItem('admin_read_sections', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    markSectionAsRead(tab);
  };

  return (
    <div className="fixed inset-0 bg-background/95 z-50 overflow-auto animate-fade-in">
      <div className="container max-w-7xl mx-auto p-3 sm:p-6 animate-slide-up">
        <AdminPanelHeader 
          onClose={onClose}
          onShowBalanceDialog={(action) => {
            setBalanceAction(action);
            setShowBalanceDialog(true);
          }}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          adminNotifications={adminNotifications}
          onMarkNotificationsRead={markNotificationsRead}
          userId={currentUser.id.toString()}
          onUsersDeleted={fetchUsers}
        />

        <AdminPanelTabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          sectionCounts={sectionCounts}
          getVisibleCount={getVisibleCount}
        />

        <AdminPanelContent 
          activeTab={activeTab}
          users={users}
          topics={topics}
          disputes={disputes}
          withdrawals={withdrawals}
          deposits={deposits}
          btcWithdrawals={btcWithdrawals}
          flashUsdtOrders={flashUsdtOrders}
          tickets={tickets}
          deals={deals}
          currentUser={currentUser}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          onDeleteUser={handleDeleteUser}
          onChangeForumRole={handleChangeForumRole}
          onManageBtc={handleManageBtc}
          onVerifyUser={handleVerifyUser}
          onManageToken={handleManageToken}
          onEditTopic={handleEditTopic}
          onDeleteTopic={handleDeleteTopic}
          onUpdateViews={handleUpdateViews}
          onRefreshWithdrawals={fetchWithdrawals}
          onRefreshDeposits={fetchDeposits}
          onRefreshBtcWithdrawals={fetchBtcWithdrawals}
          onRefreshFlashUsdt={fetchFlashUsdtOrders}
          onRefreshTickets={fetchTickets}
          onRefreshTopics={fetchTopics}
          onUpdateTicketStatus={handleUpdateTicketStatus}
          onRefreshDeals={fetchDeals}
          onDownloadExchangeData={downloadExchangeTransactions}
          onViewUserExpenses={viewUserExpenses}
        />

        <AdminBalanceDialog 
          open={showBalanceDialog}
          onOpenChange={setShowBalanceDialog}
          balanceAction={balanceAction}
          balanceUsername={balanceUsername}
          setBalanceUsername={setBalanceUsername}
          balanceAmount={balanceAmount}
          setBalanceAmount={setBalanceAmount}
          balanceLoading={balanceLoading}
          onAddBalance={handleAddBalance}
        />

        <AdminBtcBalanceDialog
          open={showBtcBalanceDialog}
          onClose={() => setShowBtcBalanceDialog(false)}
          username={btcBalanceUsername}
          currentBalance={btcBalanceAmount}
          onSubmit={handleBtcBalanceSubmit}
          loading={btcBalanceLoading}
        />

        <AdminTokenBalanceDialog
          open={showTokenBalanceDialog}
          onOpenChange={setShowTokenBalanceDialog}
          userId={tokenBalanceUserId}
          username={tokenBalanceUsername}
          tokenSymbol={tokenSymbol}
          currentBalance={tokenCurrentBalance}
          onSubmit={handleTokenBalanceSubmit}
        />

        <AdminTopicEditDialog 
          open={editingTopic !== null}
          onOpenChange={(open) => !open && setEditingTopic(null)}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editContent={editContent}
          setEditContent={setEditContent}
          onSave={handleSaveEdit}
        />
      </div>
    </div>
  );
};

export default AdminPanel;