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

const AdminPanel = ({ currentUser, onClose }: AdminPanelProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [disputes, setDisputes] = useState<EscrowDeal[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'topics' | 'disputes' | 'deposits' | 'withdrawals'>('users');
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
      console.error('Ошибка загрузки пополнений:', error);
    }
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
      <div className="container max-w-7xl mx-auto p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Icon name="Shield" size={28} className="text-primary" />
            <h1 className="text-3xl font-bold">Админ-панель</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={notificationsRef}>
              <Button 
                onClick={() => setShowNotifications(!showNotifications)} 
                variant="ghost"
                className="relative"
              >
                <Icon name="Bell" size={20} />
                {adminNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
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
            <Button onClick={onClose} variant="ghost">
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-1 inline-flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-lg transition-all ${
                activeTab === 'users'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Пользователи
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`px-6 py-2 rounded-lg transition-all ${
                activeTab === 'topics'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Темы форума
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-6 py-2 rounded-lg transition-all ${
                activeTab === 'disputes'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Споры гаранта
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-6 py-2 rounded-lg transition-all ${
                activeTab === 'deposits'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ввод
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-6 py-2 rounded-lg transition-all ${
                activeTab === 'withdrawals'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Вывод
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
          />
        )}

        {activeTab === 'topics' && (
          <AdminTopicsTab
            topics={topics}
            onEditTopic={handleEditTopic}
            onDeleteTopic={handleDeleteTopic}
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