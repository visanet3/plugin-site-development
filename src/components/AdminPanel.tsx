import { useState, useEffect } from 'react';
import { User, ForumTopic } from '@/types';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
}

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';
const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';

const AdminPanel = ({ currentUser, onClose }: AdminPanelProps) => {
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
    alert('Backend функция /admin не развернута из-за лимита функций (5/5). Для работы админ-панели необходимо увеличить лимит.');
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
        alert('Тема удалена');
      } else {
        alert(data.error || 'Ошибка удаления темы');
      }
    } catch (error) {
      console.error('Ошибка удаления темы:', error);
      alert('Ошибка удаления темы');
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
        alert('Пользователь заблокирован');
      }
    } catch (error) {
      console.error('Ошибка блокировки:', error);
      alert('Ошибка блокировки');
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
        alert('Пользователь разблокирован');
      }
    } catch (error) {
      console.error('Ошибка разблокировки:', error);
      alert('Ошибка разблокировки');
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
        alert('Роль обновлена');
      }
    } catch (error) {
      console.error('Ошибка изменения роли:', error);
      alert('Ошибка изменения роли');
    }
  };

  const handleAddBalance = async () => {
    const amount = parseFloat(balanceAmount);
    if (!balanceUsername.trim()) {
      alert('Введите никнейм пользователя');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму');
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
        alert(`Баланс пользователя ${balanceUsername} пополнен на ${amount} USDT`);
        setShowBalanceDialog(false);
        setBalanceUsername('');
        setBalanceAmount('');
        fetchUsers();
      } else {
        alert(data.error || 'Ошибка пополнения баланса');
      }
    } catch (error) {
      console.error('Ошибка пополнения баланса:', error);
      alert('Ошибка пополнения баланса');
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
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Управление пользователями</h2>
            <div className="space-y-3">
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon name="User" size={20} />
                    </div>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 text-right">
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </span>
                      <select
                        value={user.forum_role || 'new'}
                        onChange={(e) => handleChangeForumRole(user.id, e.target.value)}
                        className="px-2 py-1 text-xs rounded bg-background border border-border"
                        disabled={user.id === currentUser.id}
                      >
                        <option value="new">Новичок</option>
                        <option value="member">Участник</option>
                        <option value="verified">Проверенный</option>
                        <option value="moderator">Модератор</option>
                        <option value="admin">Администратор</option>
                        <option value="vip">VIP</option>
                        <option value="legend">Легенда</option>
                      </select>
                    </div>
                    {user.is_blocked && (
                      <span className="px-3 py-1 bg-destructive/20 text-destructive text-xs rounded-full">
                        Заблокирован
                      </span>
                    )}
                    {user.id !== currentUser.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => user.is_blocked ? handleUnblockUser(user.id) : handleBlockUser(user.id, user.username)}
                        className={user.is_blocked ? 'text-green-500' : 'text-destructive'}
                      >
                        {user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Управление темами форума</h2>
              <span className="text-sm text-muted-foreground">
                Всего тем: {topics.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {topics.map(topic => (
                <div
                  key={topic.id}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{topic.title}</h3>
                        {topic.is_pinned && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
                            Закреплено
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {topic.content?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="User" size={14} />
                          {topic.author_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Eye" size={14} />
                          {topic.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="MessageSquare" size={14} />
                          {topic.comments_count || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTopic(topic)}
                        disabled
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать тему</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Заголовок</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Заголовок темы"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Содержание</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Содержание темы"
                  rows={8}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setEditingTopic(null)}>
                  Отмена
                </Button>
                <Button onClick={handleSaveEdit}>
                  Сохранить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Пополнение баланса пользователя</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Никнейм пользователя</label>
                <Input
                  value={balanceUsername}
                  onChange={(e) => setBalanceUsername(e.target.value)}
                  placeholder="Введите никнейм"
                  disabled={balanceLoading}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Сумма (USDT)</label>
                <Input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Введите сумму"
                  min="0.01"
                  step="0.01"
                  disabled={balanceLoading}
                />
              </div>
              <div className="flex gap-2">
                {[10, 50, 100, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setBalanceAmount(amount.toString())}
                    disabled={balanceLoading}
                    className="flex-1"
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowBalanceDialog(false);
                    setBalanceUsername('');
                    setBalanceAmount('');
                  }}
                  disabled={balanceLoading}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleAddBalance}
                  disabled={balanceLoading || !balanceUsername || !balanceAmount}
                  className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
                >
                  {balanceLoading ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Icon name="Check" size={16} className="mr-2" />
                      Пополнить
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;