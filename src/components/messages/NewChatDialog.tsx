import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newChatUsername: string;
  onUsernameChange: (username: string) => void;
  onSubmit: () => void;
  searching: boolean;
}

export const NewChatDialog = ({
  open,
  onOpenChange,
  newChatUsername,
  onUsernameChange,
  onSubmit,
  searching
}: NewChatDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый чат</DialogTitle>
          <DialogDescription>
            Введите никнейм пользователя, чтобы начать с ним общение
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Никнейм пользователя</Label>
            <Input
              value={newChatUsername}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Например: crypto_user"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />
          </div>
          <Button onClick={onSubmit} disabled={searching || !newChatUsername.trim()} className="w-full">
            <Icon name="Search" size={18} className="mr-2" />
            {searching ? 'Поиск...' : 'Найти пользователя'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
