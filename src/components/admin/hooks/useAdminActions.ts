import { useToast } from '@/hooks/use-toast';
import { ForumTopic } from '@/types';

const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';
const TICKETS_URL = 'https://functions.poehali.dev/f2a5cbce-6afc-4ef1-91a6-f14075db8567';

export const useAdminActions = (currentUserId: number) => {
  const { toast } = useToast();

  const handleEditTopic = (
    topic: ForumTopic,
    setEditingTopic: (topic: ForumTopic) => void,
    setEditTitle: (title: string) => void,
    setEditContent: (content: string) => void
  ) => {
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

  const handleDeleteTopic = async (topicId: number, fetchTopics: () => void) => {
    if (!confirm('Удалить эту тему? Она будет скрыта для пользователей.')) return;
    
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
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

  const handleUpdateViews = async (topicId: number, views: number, fetchTopics: () => void) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'update_views',
          topic_id: topicId,
          views: views
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: 'Количество просмотров обновлено'
        });
        fetchTopics();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить просмотры',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить просмотры',
        variant: 'destructive'
      });
    }
  };

  const handleBlockUser = async (userId: number, username: string, fetchUsers: () => void) => {
    const reason = prompt(`Заблокировать пользователя ${username}?\nУкажите причину:`);
    if (!reason) return;
    
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
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

  const handleUnblockUser = async (userId: number, fetchUsers: () => void) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
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

  const handleDeleteUser = async (userId: number, username: string, fetchUsers: () => void) => {
    const confirmed = window.confirm(`Удалить пользователя ${username}? Это действие нельзя отменить!`);
    if (!confirmed) return;
    
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'delete_user',
          user_id: userId
        })
      });
      
      const data = await response.json();
      console.log('Delete user response:', data);
      if (data.success) {
        fetchUsers();
        toast({
          title: 'Успешно',
          description: 'Пользователь удалён'
        });
      } else {
        console.error('Delete user error:', data.error);
        toast({
          title: 'Ошибка удаления пользователя',
          description: data.error || 'Неизвестная ошибка',
          variant: 'destructive',
          duration: 10000
        });
      }
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка удаления пользователя',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTicketStatus = async (ticketId: number, status: 'open' | 'answered' | 'closed', fetchTickets: () => void) => {
    try {
      const response = await fetch(TICKETS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'update_status',
          ticket_id: ticketId,
          status: status
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchTickets();
      }
    } catch (error) {
      console.error('Ошибка обновления статуса тикета:', error);
    }
  };

  const handleChangeForumRole = async (userId: number, forumRole: string, fetchUsers: () => void) => {
    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
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

  const handleVerifyUser = async (userId: number, username: string, fetchUsers: () => void) => {
    if (!confirm(`Вы уверены, что хотите верифицировать пользователя ${username}?`)) {
      return;
    }

    try {
      const response = await fetch(ADMIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'verify_user',
          user_id: userId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: `Пользователь ${username} верифицирован`
        });
        fetchUsers();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка верификации',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка верификации:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    }
  };

  return {
    handleEditTopic,
    handleSaveEdit,
    handleDeleteTopic,
    handleUpdateViews,
    handleBlockUser,
    handleUnblockUser,
    handleDeleteUser,
    handleUpdateTicketStatus,
    handleChangeForumRole,
    handleVerifyUser
  };
};
