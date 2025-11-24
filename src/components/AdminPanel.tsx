import { useState, useEffect } from 'react';
import { User, ForumTopic, EscrowDeal } from '@/types';
import AdminPanelHeader from '@/components/admin/AdminPanelHeader';
import AdminPanelTabs from '@/components/admin/AdminPanelTabs';
import AdminPanelContent from '@/components/admin/AdminPanelContent';
import AdminBalanceDialog from '@/components/admin/AdminBalanceDialog';
import AdminTopicEditDialog from '@/components/admin/AdminTopicEditDialog';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
}

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';
const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';
const ESCROW_URL = 'https://functions.poehali.dev/82c75fbc-83e4-4448-9ff8-1c8ef9bbec09';
const WITHDRAWAL_URL = 'https://functions.poehali.dev/09f16983-ec42-41fe-a7bd-695752ee11c5';
const CRYPTO_URL = 'https://functions.poehali.dev/8caa3b76-72e5-42b5-9415-91d1f9b05210';
const FLASH_USDT_URL = 'https://functions.poehali.dev/9d93686d-9a6f-47bc-85a8-7b7c28e4edd7';
const TICKETS_URL = 'https://functions.poehali.dev/f2a5cbce-6afc-4ef1-91a6-f14075db8567';

const AdminPanel = ({ currentUser, onClose }: AdminPanelProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [disputes, setDisputes] = useState<EscrowDeal[]>([]);
  const [escrowDeals, setEscrowDeals] = useState<EscrowDeal[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [btcWithdrawals, setBtcWithdrawals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'topics' | 'disputes' | 'deposits' | 'withdrawals' | 'btc-withdrawals' | 'escrow' | 'flash-usdt' | 'tickets' | 'verification' | 'forum-categories'>('users');
  const [flashUsdtOrders, setFlashUsdtOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [editingTopic, setEditingTopic] = useState<ForumTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceUsername, setBalanceUsername] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);
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
      escrow: 0,
      flashUsdt: 0,
      tickets: 0,
      verification: 0
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
    } else if (activeTab === 'escrow') {
      fetchAllEscrowDeals();
    } else if (activeTab === 'flash-usdt') {
      fetchFlashUsdtOrders();
    } else if (activeTab === 'tickets') {
      fetchTickets();
    } else if (activeTab === 'btc-withdrawals') {
      fetchBtcWithdrawals();
    }
    
    markSectionAsRead(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchAdminNotifications(),
        fetchAllCounts()
      ]);
      setTimeout(() => setIsInitialLoad(false), 100);
    };
    
    loadInitialData();
    
    const interval = setInterval(() => {
      fetchAdminNotifications();
      fetchAllCounts();
      if (activeTab === 'users') {
        fetchUsers();
      }
      if (activeTab === 'tickets') {
        fetchTickets();
      }
    }, 5000);
    
    return () => clearInterval(interval);
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
      const response = await fetch(`${ESCROW_URL}?action=list&status=dispute`);
      const data = await response.json();
      setDisputes(data.deals || []);
    } catch (error) {
      console.error('Ошибка загрузки споров:', error);
    }
  };

  const fetchAllEscrowDeals = async () => {
    try {
      const [openResponse, completedResponse] = await Promise.all([
        fetch(`${ESCROW_URL}?action=list&status=open`),
        fetch(`${ESCROW_URL}?action=list&status=completed`)
      ]);
      const openData = await openResponse.json();
      const completedData = await completedResponse.json();
      const allDeals = [...(openData.deals || []), ...(completedData.deals || [])];
      setEscrowDeals(allDeals);
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
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
      const response = await fetch(`${ADMIN_URL}?action=btc_withdrawals`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setBtcWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки BTC заявок:', error);
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
        escrowRes,
        flashUsdtRes,
        btcWithdrawalsRes
      ] = await Promise.all([
        fetch(`${ADMIN_URL}?action=users`, { headers: { 'X-User-Id': currentUser.id.toString() } }),
        fetch(FORUM_URL),
        fetch(`${ESCROW_URL}?action=list&status=dispute`),
        fetch(`${WITHDRAWAL_URL}?action=all_withdrawals&status=processing`, { headers: { 'X-User-Id': currentUser.id.toString() } }),
        fetch(`${CRYPTO_URL}?action=all_deposits&status=pending`, { headers: { 'X-User-Id': currentUser.id.toString() } }),
        fetch(`${ESCROW_URL}?action=list&status=open`),
        fetch(`${FLASH_USDT_URL}?action=admin_orders`, { headers: { 'X-User-Id': currentUser.id.toString() } }),
        fetch(`${ADMIN_URL}?action=btc_withdrawals`, { headers: { 'X-User-Id': currentUser.id.toString() } })
      ]);

      const [usersData, topicsData, disputesData, withdrawalsData, depositsData, escrowData, flashUsdtData, btcWithdrawalsData] = await Promise.all([
        usersRes.json(),
        topicsRes.json(),
        disputesRes.json(),
        withdrawalsRes.json(),
        depositsRes.json(),
        escrowRes.json(),
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

      const newCounts = {
        users: newUsers,
        topics: newTopics,
        disputes: (disputesData.deals || []).length,
        deposits: (depositsData.deposits || []).filter((d: any) => d.status === 'pending').length,
        withdrawals: (withdrawalsData.withdrawals || []).filter((w: any) => w.status === 'processing').length,
        btcWithdrawals: (btcWithdrawalsData.withdrawals || []).filter((w: any) => w.status === 'pending').length,
        escrow: (escrowData.deals || []).filter((d: any) => d.status === 'open' && !d.buyer_id).length,
        flashUsdt: (flashUsdtData.orders || []).filter((o: any) => o.status === 'pending').length,
        tickets: openTicketsCount,
        verification: notificationCounts.verification_request
      };

      const sectionsToUnread = new Set<string>();
      const sectionNames: Record<string, string> = {
        users: 'Новый пользователь',
        topics: 'Новая тема форума',
        disputes: 'Новый спор',
        deposits: 'Новое пополнение',
        withdrawals: 'Новая заявка на вывод USDT',
        btcWithdrawals: 'Новая заявка на вывод BTC',
        escrow: 'Новая гарант-сделка',
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
          action: 'add_balance',
          username: balanceUsername.trim(),
          amount: amount
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: `Баланс пользователя ${balanceUsername} пополнен на ${amount} USDT`
        });
        setShowBalanceDialog(false);
        setBalanceUsername('');
        setBalanceAmount('');
        fetchUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка пополнения баланса',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка пополнения баланса:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка пополнения баланса',
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
          onShowBalanceDialog={() => setShowBalanceDialog(true)}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          adminNotifications={adminNotifications}
          onMarkNotificationsRead={markNotificationsRead}
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
          escrowDeals={escrowDeals}
          flashUsdtOrders={flashUsdtOrders}
          tickets={tickets}
          currentUser={currentUser}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          onDeleteUser={handleDeleteUser}
          onChangeForumRole={handleChangeForumRole}
          onEditTopic={handleEditTopic}
          onDeleteTopic={handleDeleteTopic}
          onUpdateViews={handleUpdateViews}
          onRefreshWithdrawals={fetchWithdrawals}
          onRefreshDeposits={fetchDeposits}
          onRefreshBtcWithdrawals={fetchBtcWithdrawals}
          onRefreshEscrow={fetchAllEscrowDeals}
          onRefreshFlashUsdt={fetchFlashUsdtOrders}
          onRefreshTickets={fetchTickets}
          onRefreshTopics={fetchTopics}
          onUpdateTicketStatus={handleUpdateTicketStatus}
        />

        <AdminBalanceDialog 
          open={showBalanceDialog}
          onOpenChange={setShowBalanceDialog}
          balanceUsername={balanceUsername}
          setBalanceUsername={setBalanceUsername}
          balanceAmount={balanceAmount}
          setBalanceAmount={setBalanceAmount}
          balanceLoading={balanceLoading}
          onAddBalance={handleAddBalance}
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