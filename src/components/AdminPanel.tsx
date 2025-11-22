import { useState, useEffect } from 'react';
import { User, ForumTopic } from '@/types';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminTopicsTab from '@/components/admin/AdminTopicsTab';
import AdminBalanceDialog from '@/components/admin/AdminBalanceDialog';
import AdminTopicEditDialog from '@/components/admin/AdminTopicEditDialog';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
}

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';
const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';

const AdminPanel = ({ currentUser, onClose }: AdminPanelProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'topics'>('users');
  const [editingTopic, setEditingTopic] = useState<ForumTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceUsername, setBalanceUsername] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'topics') {
      fetchTopics();
    }
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
          <Button onClick={onClose} variant="ghost">
            <Icon name="X" size={20} />
          </Button>
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