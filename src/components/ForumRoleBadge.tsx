import { Badge } from '@/components/ui/badge';

interface ForumRoleBadgeProps {
  role?: string;
}

const ForumRoleBadge = ({ role }: ForumRoleBadgeProps) => {
  if (!role) return null;

  const roleConfig: Record<string, { label: string; className: string }> = {
    new: {
      label: 'Новичок',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    member: {
      label: 'Участник',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    verified: {
      label: 'Проверенный',
      className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    moderator: {
      label: 'Модератор',
      className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    vip: {
      label: 'VIP',
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    legend: {
      label: 'Легенда',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  };

  const config = roleConfig[role] || {
    label: role,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export default ForumRoleBadge;
