import { useState, useEffect } from 'react';
import { ForumTopic, ForumCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AdminForumModerationProps {
  topics: ForumTopic[];
  onRefresh: () => void;
  currentUserId: number;
}

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';

export const AdminForumModeration = ({ topics, onRefresh, currentUserId }: AdminForumModerationProps) => {
  const { toast } = useToast();
  const [editingTopic, setEditingTopic] = useState<ForumTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | undefined>();
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editIsClosed, setEditIsClosed] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [allCategories, setAllCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [movingTopicId, setMovingTopicId] = useState<number | null>(null);
  const [selectedMoveCategory, setSelectedMoveCategory] = useState<string>('');
  const [viewingTopicId, setViewingTopicId] = useState<number | null>(null);
  const [topicDetails, setTopicDetails] = useState<any>(null);
  const [boostViewsCount, setBoostViewsCount] = useState<number>(100);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${FORUM_URL}?action=get_categories`);
      const data = await response.json();
      if (data.success && data.categories) {
        const subcats: ForumCategory[] = [];
        data.categories.forEach((parent: ForumCategory) => {
          if (parent.subcategories) {
            subcats.push(...parent.subcategories);
          }
        });
        setCategories(subcats);
        setAllCategories(data.categories);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const handleQuickMoveCategory = async (topicId: number, categoryId: number) => {
    setLoading(true);
    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_update_topic',
          topic_id: topicId,
          category_id: categoryId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Тема перемещена в другую категорию'
        });
        setMovingTopicId(null);
        setSelectedMoveCategory('');
        onRefresh();
      } else {
        throw new Error(data.error || 'Ошибка перемещения');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openMoveCategoryDialog = (topicId: number) => {
    setMovingTopicId(topicId);
    setSelectedMoveCategory('');
    fetchCategories();
  };

  const handleEditTopic = (topic: ForumTopic) => {
    setEditingTopic(topic);
    setEditTitle(topic.title);
    setEditContent(topic.content || '');
    setEditCategoryId(topic.category_id);
    setEditIsPinned(topic.is_pinned);
    setEditIsClosed(false);
    fetchCategories();
  };

  const handleSaveEdit = async () => {
    if (!editingTopic) return;

    setLoading(true);
    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_update_topic',
          topic_id: editingTopic.id,
          title: editTitle,
          content: editContent,
          category_id: editCategoryId,
          is_pinned: editIsPinned,
          is_closed: editIsClosed
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Тема обновлена'
        });
        setEditingTopic(null);
        onRefresh();
      } else {
        throw new Error(data.error || 'Ошибка обновления');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (topic: ForumTopic) => {
    setLoading(true);
    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_update_topic',
          topic_id: topic.id,
          is_pinned: !topic.is_pinned
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: topic.is_pinned ? 'Тема откреплена' : 'Тема закреплена'
        });
        onRefresh();
      } else {
        throw new Error(data.error || 'Ошибка обновления');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!confirm('Удалить эту тему?')) return;

    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_delete_topic',
          topic_id: topicId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Тема удалена'
        });
        onRefresh();
      } else {
        throw new Error(data.error || 'Ошибка удаления');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const fetchTopicDetails = async (topicId: number) => {
    try {
      const response = await fetch(`${FORUM_URL}?topic_id=${topicId}`);
      const data = await response.json();
      if (data.topic) {
        const topic = data.topic;
        const comments = data.comments || [];
        
        const topLevelComments = comments.filter((c: any) => !c.parent_id);
        const commentsWithReplies = topLevelComments.map((comment: any) => ({
          ...comment,
          replies: comments.filter((c: any) => c.parent_id === comment.id)
        }));
        
        setTopicDetails({
          ...topic,
          comments: commentsWithReplies
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей темы:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Удалить этот комментарий?')) return;

    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_delete_comment',
          comment_id: commentId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Комментарий удален'
        });
        if (viewingTopicId) fetchTopicDetails(viewingTopicId);
      } else {
        throw new Error(data.error || 'Ошибка удаления');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!confirm('Удалить этот ответ?')) return;

    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_delete_reply',
          reply_id: replyId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Ответ удален'
        });
        if (viewingTopicId) fetchTopicDetails(viewingTopicId);
      } else {
        throw new Error(data.error || 'Ошибка удаления');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleBoostViews = async () => {
    if (!viewingTopicId) return;
    if (boostViewsCount < 1 || boostViewsCount > 10000) {
      toast({
        title: 'Ошибка',
        description: 'Укажите число от 1 до 10000',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_boost_views',
          topic_id: viewingTopicId,
          views_count: boostViewsCount
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: `Просмотры увеличены на ${boostViewsCount}`
        });
        fetchTopicDetails(viewingTopicId);
        onRefresh();
      } else {
        throw new Error(data.error || 'Ошибка обновления');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const openTopicDetails = (topicId: number) => {
    setViewingTopicId(topicId);
    fetchTopicDetails(topicId);
  };

  useEffect(() => {
    if (viewingTopicId) {
      fetchTopicDetails(viewingTopicId);
    }
  }, [viewingTopicId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Модерация форума</h2>
        <Badge variant="outline">{topics.length} тем</Badge>
      </div>

      <div className="space-y-2">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-4 hover:border-zinc-700/80 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {topic.is_pinned && (
                    <Badge variant="default" className="text-xs bg-zinc-700">
                      <Icon name="Pin" size={12} className="mr-1" />
                      PIN
                    </Badge>
                  )}
                  {topic.parent_category_name && topic.parent_category_color && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        color: topic.parent_category_color,
                        backgroundColor: `${topic.parent_category_color}15`
                      }}
                    >
                      {topic.parent_category_name}
                    </Badge>
                  )}
                  {topic.category_name && topic.category_color && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        color: topic.category_color,
                        backgroundColor: `${topic.category_color}15`
                      }}
                    >
                      {topic.category_name}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-base mb-1">{topic.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{topic.author_name}</span>
                  <span>•</span>
                  <span>{new Date(topic.created_at).toLocaleDateString('ru')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Icon name="MessageCircle" size={12} />
                    {topic.comments_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Eye" size={12} />
                    {topic.views}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTogglePin(topic)}
                  disabled={loading}
                  title={topic.is_pinned ? 'Открепить тему' : 'Закрепить тему'}
                >
                  <Icon name="Pin" size={16} className={topic.is_pinned ? 'text-yellow-500' : ''} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openMoveCategoryDialog(topic.id)}
                  title="Переместить в другую категорию"
                >
                  <Icon name="FolderInput" size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openTopicDetails(topic.id)}
                  title="Просмотр и модерация"
                >
                  <Icon name="Eye" size={14} className="mr-1" />
                  Модерация
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditTopic(topic)}
                >
                  <Icon name="Edit2" size={14} className="mr-1" />
                  Редактировать
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteTopic(topic.id)}
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={movingTopicId !== null} onOpenChange={() => setMovingTopicId(null)}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Переместить тему в категорию</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              Выберите категорию, в которую хотите переместить тему
            </p>
            {allCategories.map((parent) => (
              <div key={parent.id} className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Icon name={parent.icon as any} size={16} />
                  {parent.name}
                </div>
                <div className="pl-6 space-y-1">
                  {parent.subcategories?.map((subcat) => (
                    <button
                      key={subcat.id}
                      onClick={() => setSelectedMoveCategory(subcat.id.toString())}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedMoveCategory === subcat.id.toString()
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                      style={{
                        borderLeft: `3px solid ${subcat.color}`
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon name={subcat.icon as any} size={14} />
                        {subcat.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovingTopicId(null)}>
              Отмена
            </Button>
            <Button
              onClick={() => movingTopicId && handleQuickMoveCategory(movingTopicId, parseInt(selectedMoveCategory))}
              disabled={!selectedMoveCategory || loading}
            >
              {loading ? 'Перемещение...' : 'Переместить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактирование темы</DialogTitle>
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
                rows={6}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Категория</label>
              <Select
                value={editCategoryId?.toString()}
                onValueChange={(value) => setEditCategoryId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsPinned}
                  onChange={(e) => setEditIsPinned(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Закрепить тему</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsClosed}
                  onChange={(e) => setEditIsClosed(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Закрыть комментарии</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTopic(null)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewingTopicId !== null} onOpenChange={() => setViewingTopicId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Модерация темы</DialogTitle>
          </DialogHeader>
          {topicDetails && (
            <div className="overflow-y-auto flex-1 space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-xl font-bold mb-2">{topicDetails.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>Автор: {topicDetails.author_name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Icon name="Eye" size={14} />
                    {topicDetails.views} просмотров
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Icon name="MessageCircle" size={14} />
                    {topicDetails.comments?.length || 0} комментариев
                  </span>
                </div>
                <div className="bg-zinc-900/40 rounded-lg p-4 mb-4">
                  <p className="whitespace-pre-wrap">{topicDetails.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={boostViewsCount}
                    onChange={(e) => setBoostViewsCount(parseInt(e.target.value) || 0)}
                    placeholder="Количество"
                    className="w-32"
                    min={1}
                    max={10000}
                  />
                  <Button onClick={handleBoostViews} size="sm" variant="outline">
                    <Icon name="TrendingUp" size={14} className="mr-1" />
                    Накрутить просмотры
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Комментарии:</h4>
                {topicDetails.comments && topicDetails.comments.length > 0 ? (
                  topicDetails.comments.map((comment: any) => (
                    <div key={comment.id} className="bg-zinc-900/40 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{comment.author_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString('ru')}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{comment.content}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-6 space-y-2 border-l-2 border-zinc-800">
                          {comment.replies.map((reply: any) => (
                            <div key={reply.id} className="bg-zinc-800/40 rounded-lg p-3 flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">{reply.author_name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.created_at).toLocaleString('ru')}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteReply(reply.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Icon name="Trash2" size={12} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Нет комментариев</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingTopicId(null)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminForumModeration;