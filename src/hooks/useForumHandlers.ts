import { User, ForumTopic, ForumComment } from '@/types';

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';

interface UseForumHandlersProps {
  user: User | null;
  selectedTopic: ForumTopic | null;
  newTopicTitle: string;
  newTopicContent: string;
  newComment: string;
  setSelectedTopic: (topic: ForumTopic | null) => void;
  setTopicComments: (comments: ForumComment[]) => void;
  setNewTopicTitle: (title: string) => void;
  setNewTopicContent: (content: string) => void;
  setShowTopicDialog: (show: boolean) => void;
  setActiveView: (view: 'plugins' | 'forum') => void;
  fetchForumTopics: () => void;
  setNewComment: (comment: string) => void;
  setForumTopics: (updater: (topics: ForumTopic[]) => ForumTopic[]) => void;
}

export const useForumHandlers = ({
  user,
  selectedTopic,
  newTopicTitle,
  newTopicContent,
  newComment,
  setSelectedTopic,
  setTopicComments,
  setNewTopicTitle,
  setNewTopicContent,
  setShowTopicDialog,
  setActiveView,
  fetchForumTopics,
  setNewComment,
  setForumTopics
}: UseForumHandlersProps) => {
  const handleCreateTopic = async () => {
    if (!user) {
      alert('Войдите для создания темы');
      return;
    }
    if (!newTopicTitle || !newTopicContent) {
      alert('Заполните все поля');
      return;
    }
    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'create_topic',
          title: newTopicTitle,
          content: newTopicContent
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewTopicTitle('');
        setNewTopicContent('');
        setShowTopicDialog(false);
        setActiveView('forum');
        fetchForumTopics();
      }
    } catch (error) {
      console.error('Ошибка создания темы:', error);
    }
  };

  const handleCreateComment = async () => {
    if (!user) {
      alert('Войдите для комментирования');
      return;
    }
    if (!newComment || !selectedTopic) return;
    try {
      const response = await fetch(FORUM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'create_comment',
          topic_id: selectedTopic.id,
          content: newComment
        })
      });
      const data = await response.json();
      if (data.success) {
        setNewComment('');
        const topicResponse = await fetch(`${FORUM_URL}?topic_id=${selectedTopic.id}`);
        const topicData = await topicResponse.json();
        setTopicComments(topicData.comments || []);
      }
    } catch (error) {
      console.error('Ошибка создания комментария:', error);
    }
  };

  const handleTopicSelect = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    try {
      const response = await fetch(`${FORUM_URL}?topic_id=${topic.id}`);
      const data = await response.json();
      setTopicComments(data.comments || []);
      
      if (data.topic) {
        const updatedTopic = { ...topic, views: data.topic.views };
        setSelectedTopic(updatedTopic);
        
        setForumTopics(prevTopics => 
          prevTopics.map(t => t.id === topic.id ? updatedTopic : t)
        );
      }
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    }
  };

  return {
    handleCreateTopic,
    handleCreateComment,
    handleTopicSelect
  };
};
