import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { ForumCategory, User } from '@/types';
import ForumCategorySelector from './ForumCategorySelector';
import { useToast } from '@/hooks/use-toast';
import { triggerNotificationUpdate } from '@/utils/notificationEvents';

interface CreateTopicDialogProps {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onTopicCreated: () => void;
}

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';

const CreateTopicDialog = ({
  open,
  user,
  onOpenChange,
  onTopicCreated
}: CreateTopicDialogProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch(`${FORUM_URL}?action=get_categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Требуется авторизация',
        variant: 'destructive'
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedCategory) {
      toast({
        title: 'Ошибка',
        description: 'Выберите категорию',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        action: 'create_topic',
        title: title.trim(),
        content: content.trim(),
        category_id: selectedCategory
      };
      
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString()
      };
      
      console.log('Creating topic with:', { requestHeaders, requestBody });
      
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Тема создана'
        });
        triggerNotificationUpdate(user.id, user.role);
        setTitle('');
        setContent('');
        setSelectedCategory(null);
        onOpenChange(false);
        onTopicCreated();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать тему',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка создания темы:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Plus" size={24} />
            Создать новую тему
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoadingCategories ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <ForumCategorySelector
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              <div>
                <label className="block text-sm font-medium mb-2">Заголовок темы *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите заголовок темы"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Описание *</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Опишите вашу тему подробнее"
                  rows={6}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {content.length}/5000 символов
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim() || !content.trim() || !selectedCategory}
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Icon name="Check" size={16} className="mr-2" />
                      Создать тему
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTopicDialog;