import { User } from '@/types';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface AdminUsersTabProps {
  users: User[];
  currentUser: User;
  onBlockUser: (userId: number, username: string) => void;
  onUnblockUser: (userId: number) => void;
  onChangeForumRole: (userId: number, forumRole: string) => void;
  onDeleteUser: (userId: number, username: string) => void;
}

const AdminUsersTab = ({ 
  users, 
  currentUser, 
  onBlockUser, 
  onUnblockUser, 
  onChangeForumRole,
  onDeleteUser
}: AdminUsersTabProps) => {
  const isUserOnline = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return false;
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60;
    return diffMinutes < 5;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Управление пользователями</h2>
      <div className="space-y-3">
        {users.map(user => (
          <div
            key={user.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Icon name="User" size={20} />
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                  isUserOnline(user.last_seen_at) ? 'bg-green-500' : 'bg-gray-500'
                }`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm sm:text-base">{user.username}</p>
                  {isUserOnline(user.last_seen_at) && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded-full">
                      Онлайн
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground break-all">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className={`px-2 sm:px-3 py-1 text-xs rounded-full text-center ${
                  user.role === 'admin' 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </span>
                <select
                  value={user.forum_role || 'new'}
                  onChange={(e) => onChangeForumRole(user.id, e.target.value)}
                  className="px-2 py-1 text-xs rounded bg-background border border-border w-full"
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
                <span className="px-2 sm:px-3 py-1 bg-destructive/20 text-destructive text-xs rounded-full text-center">
                  Заблокирован
                </span>
              )}
              {user.id !== currentUser.id && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => user.is_blocked ? onUnblockUser(user.id) : onBlockUser(user.id, user.username)}
                    className={`text-xs flex-1 sm:flex-none ${user.is_blocked ? 'text-green-500' : 'text-destructive'}`}
                  >
                    <Icon name={user.is_blocked ? 'Check' : 'Ban'} size={14} className="sm:mr-1" />
                    <span className="hidden sm:inline">{user.is_blocked ? 'Разблокировать' : 'Заблокировать'}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteUser(user.id, user.username)}
                    className="text-red-500 hover:text-red-600 text-xs"
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersTab;