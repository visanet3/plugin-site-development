import { User } from '@/types';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface AdminUsersTabProps {
  users: User[];
  currentUser: User;
  onBlockUser: (userId: number, username: string) => void;
  onUnblockUser: (userId: number) => void;
  onChangeForumRole: (userId: number, forumRole: string) => void;
}

const AdminUsersTab = ({ 
  users, 
  currentUser, 
  onBlockUser, 
  onUnblockUser, 
  onChangeForumRole 
}: AdminUsersTabProps) => {
  return (
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
                  onChange={(e) => onChangeForumRole(user.id, e.target.value)}
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
                  onClick={() => user.is_blocked ? onUnblockUser(user.id) : onBlockUser(user.id, user.username)}
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
  );
};

export default AdminUsersTab;
