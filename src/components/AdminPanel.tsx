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

const AdminPanel = ({ currentUser, onClose }: AdminPanelProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'topics'>('users');
  const [editingTopic, setEditingTopic] = useState<ForumTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (activeTab === 'topics') {
      fetchTopics();
    }
  }, [activeTab]);

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
    alert('Backend функция /admin не развернута из-за лимита функций (5/5). Для работы админ-панели необходимо увеличить лимит.');
  };

  const handleBlockUser = async (userId: number, username: string) => {
    const reason = prompt(`Заблокировать пользователя ${username}?\nУкажите причину:`);
    if (!reason) return;
    alert('Backend функция /admin не развернута из-за лимита функций (5/5). Для работы админ-панели необходимо увеличить лимит.');
  };

  return (
    <div className="fixed inset-0 bg-background/95 z-50 overflow-auto">
      <div className="container max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Icon name="Shield" size={28} className="text-primary" />
            <h1 className="text-3xl font-bold">Админ-панель</h1>
          </div>
          <Button onClick={onClose} variant="ghost">
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-1 mb-6 inline-flex">
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

        <div className="bg-card/30 backdrop-blur-sm border border-amber-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Icon name="AlertTriangle" size={20} className="text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200">
                <strong>Backend функция недоступна:</strong> Достигнут лимит функций (5/5). 
                Для работы админ-панели необходимо увеличить лимит или удалить неиспользуемую функцию.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Функция <code>/backend/admin</code> создана, но не развернута. 
                Кнопки управления пока не работают.
              </p>
            </div>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Управление пользователями</h2>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <p className="text-muted-foreground text-center">
                Список пользователей и управление доступно после развертывания backend функции
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon name="User" size={20} />
                    </div>
                    <div>
                      <p className="font-medium">{currentUser.username}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full">
                      Администратор
                    </span>
                  </div>
                </div>
              </div>
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
                        className="text-destructive hover:text-destructive"
                        disabled
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
      </div>
    </div>
  );
};

export default AdminPanel;
