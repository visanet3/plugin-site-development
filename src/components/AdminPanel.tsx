import { useState, useEffect, useRef } from 'react';
import { User, ForumTopic, EscrowDeal } from '@/types';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminTopicsTab from '@/components/admin/AdminTopicsTab';
import AdminBalanceDialog from '@/components/admin/AdminBalanceDialog';
import AdminTopicEditDialog from '@/components/admin/AdminTopicEditDialog';
import AdminDisputesTab from '@/components/admin/AdminDisputesTab';
import AdminWithdrawalsTab from '@/components/admin/AdminWithdrawalsTab';
import AdminDepositsTab from '@/components/admin/AdminDepositsTab';
import AdminEscrowTab from '@/components/admin/AdminEscrowTab';
import AdminTicketsTab from '@/components/admin/AdminTicketsTab';
import AdminVerificationTab from '@/components/admin/AdminVerificationTab';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
}

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';
const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';
const ESCROW_URL = 'https://functions.poehali.dev/82c75fbc-83e4-4448-9ff8-1c8ef9bbec09';
const WITHDRAWAL_URL = 'https://functions.poehali.dev/09f16983-ec42-41fe-a7bd-695752ee11c5';
const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';
const CRYPTO_URL = 'https://functions.poehali.dev/8caa3b76-72e5-42b5-9415-91d1f9b05210';
const FLASH_USDT_URL = 'https://functions.poehali.dev/9d93686d-9a6f-47bc-85a8-7b7c28e4edd7';

const AdminPanel = ({ currentUser, onClose }: AdminPanelProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [disputes, setDisputes] = useState<EscrowDeal[]>([]);
  const [escrowDeals, setEscrowDeals] = useState<EscrowDeal[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'topics' | 'disputes' | 'deposits' | 'withdrawals' | 'escrow' | 'flash-usdt' | 'tickets' | 'verification'>('users');
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
  const notificationsRef = useRef<HTMLDivElement>(null);

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
    }
    fetchAdminNotifications();
    
    const interval = setInterval(() => {
      fetchAdminNotifications();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

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
    const mockTickets = [
      {
        id: 1,
        user_id: 2,
        username: 'user123',
        category: 'payment',
        subject: 'Проблема с выводом средств',
        message: 'Здравствуйте, не могу вывести средства на свой кошелек. Заявка висит в статусе "обработка" уже 2 дня.',
        status: 'open',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 2,
        user_id: 3,
        username: 'trader777',
        category: 'casino',
        subject: 'Не зачислен выигрыш',
        message: 'Выиграл в казино 500 USDT, но деньги не пришли на баланс.',
        status: 'open',
        created_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 3,
        user_id: 4,
        username: 'crypto_fan',
        category: 'flash',
        subject: 'Вопрос по Flash USDT',
        message: 'Как работает Flash USDT? Можно ли использовать на биржах?',
        status: 'answered',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        admin_response: 'Flash USDT - это временные токены для тестирования. Они не работают на биржах и исчезают через 24 часа.',
        answered_at: new Date(Date.now() - 172800000).toISOString(),
        answered_by: currentUser.username
      }
    ];
    setTickets(mockTickets);
  };

  const fetchAdminNotifications = async () => {
    try {
      const response = await fetch(`${NOTIFICATIONS_URL}?action=notifications`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      const adminAlerts = (data.notifications || []).filter(
        (notif: any) => notif.type === 'admin_alert' && !notif.is_read
      );
      setAdminNotifications(adminAlerts);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    }
  };

  const markNotificationsRead = async () => {
    try {
      await fetch(NOTIFICATIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'mark_read',
          notification_ids: adminNotifications.map(n => n.id)
        })
      });
      setAdminNotifications([]);
    } catch (error) {
      console.error('Ошибка отметки уведомлений:', error);
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
      if (data.success) {
        fetchUsers();
        toast({
          title: 'Успешно',
          description: 'Пользователь удалён'
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка удаления пользователя',
          variant: 'destructive'
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

  return (
    <div className="fixed inset-0 bg-background/95 z-50 overflow-auto animate-fade-in">
      <div className="container max-w-7xl mx-auto p-3 sm:p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Icon name="Shield" size={24} className="text-primary sm:w-7 sm:h-7" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Админ-панель</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" ref={notificationsRef}>
              <Button 
                onClick={() => setShowNotifications(!showNotifications)} 
                variant="ghost"
                className="relative px-2 sm:px-3"
              >
                <Icon name="Bell" size={18} className="sm:w-5 sm:h-5" />
                {adminNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                    {adminNotifications.length}
                  </span>
                )}
              </Button>
              {showNotifications && adminNotifications.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Уведомления</h3>
                    <Button size="sm" variant="ghost" onClick={markNotificationsRead}>
                      <Icon name="Check" size={16} />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {adminNotifications.map((notif) => (
                      <div key={notif.id} className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <p className="font-semibold text-sm">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button onClick={onClose} variant="ghost" className="px-2 sm:px-3">
              <Icon name="X" size={18} className="sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-1 inline-flex overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Пользователи
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'topics'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Темы форума
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'disputes'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Споры
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'deposits'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ввод
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'withdrawals'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Вывод
            </button>
            <button
              onClick={() => setActiveTab('escrow')}
              className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'escrow'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Гарант
            </button>
            <button
              onClick={() => setActiveTab('flash-usdt')}
              className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'flash-usdt'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Flash USDT
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'tickets'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Тикеты
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'verification'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Верификация
            </button>
          </div>
          {activeTab === 'users' && (
            <Button
              onClick={() => setShowBalanceDialog(true)}
              className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Пополнить баланс
            </Button>
          )}
        </div>

        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            currentUser={currentUser}
            onBlockUser={handleBlockUser}
            onUnblockUser={handleUnblockUser}
            onChangeForumRole={handleChangeForumRole}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'topics' && (
          <AdminTopicsTab
            topics={topics}
            onEditTopic={handleEditTopic}
            onDeleteTopic={handleDeleteTopic}
            onUpdateViews={handleUpdateViews}
          />
        )}

        {activeTab === 'disputes' && (
          <AdminDisputesTab
            disputes={disputes}
            currentUser={currentUser}
            onUpdate={fetchDisputes}
          />
        )}

        {activeTab === 'deposits' && (
          <AdminDepositsTab
            deposits={deposits}
            currentUser={currentUser}
            onUpdate={fetchDeposits}
          />
        )}

        {activeTab === 'withdrawals' && (
          <AdminWithdrawalsTab
            withdrawals={withdrawals}
            currentUser={currentUser}
            onUpdate={fetchWithdrawals}
          />
        )}

        {activeTab === 'escrow' && (
          <AdminEscrowTab
            deals={escrowDeals}
            currentUser={currentUser}
            onUpdate={fetchAllEscrowDeals}
          />
        )}

        {activeTab === 'tickets' && (
          <AdminTicketsTab
            tickets={tickets}
            currentUser={currentUser}
            onRefresh={fetchTickets}
          />
        )}

        {activeTab === 'verification' && (
          <AdminVerificationTab user={currentUser} />
        )}

        {activeTab === 'flash-usdt' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Пользователь</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Количество</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Цена</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Кошелек</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Статус</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flashUsdtOrders.map((order) => (
                      <tr key={order.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm">#{order.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{order.username || `User #${order.user_id}`}</td>
                        <td className="px-4 py-3 text-sm">{Number(order.amount).toLocaleString('ru-RU')} Flash USDT</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-400">${Number(order.price).toLocaleString('ru-RU')}</td>
                        <td className="px-4 py-3 text-sm font-mono text-xs">{order.wallet_address}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {order.status === 'completed' ? 'Выполнен' : order.status === 'pending' ? 'Ожидает' : 'Отменен'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {flashUsdtOrders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Package" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Заказов Flash USDT пока нет</p>
              </div>
            )}
          </div>
        )}

        <AdminTopicEditDialog
          topic={editingTopic}
          editTitle={editTitle}
          editContent={editContent}
          onTitleChange={setEditTitle}
          onContentChange={setEditContent}
          onClose={() => setEditingTopic(null)}
          onSave={handleSaveEdit}
        />

        <AdminBalanceDialog
          open={showBalanceDialog}
          onOpenChange={setShowBalanceDialog}
          balanceUsername={balanceUsername}
          balanceAmount={balanceAmount}
          balanceLoading={balanceLoading}
          onUsernameChange={setBalanceUsername}
          onAmountChange={setBalanceAmount}
          onAddBalance={handleAddBalance}
        />
      </div>
    </div>
  );
};

export default AdminPanel;