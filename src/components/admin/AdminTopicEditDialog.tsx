import { ForumTopic } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AdminTopicEditDialogProps {
  topic: ForumTopic | null;
  editTitle: string;
  editContent: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onClose: () => void;
  onSave: () => void;
}

const AdminTopicEditDialog = ({
  topic,
  editTitle,
  editContent,
  onTitleChange,
  onContentChange,
  onClose,
  onSave
}: AdminTopicEditDialogProps) => {
  return (
    <Dialog open={!!topic} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактировать тему</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Заголовок</label>
            <Input
              value={editTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Заголовок темы"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Содержание</label>
            <Textarea
              value={editContent}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Содержание темы"
              rows={8}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={onSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminTopicEditDialog;
