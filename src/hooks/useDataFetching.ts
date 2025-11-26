import { useEffect } from 'react';
import { Plugin, Category, ForumTopic } from '@/types';

const BACKEND_URL = 'https://functions.poehali.dev/31d6d088-cb0f-40fb-80d4-bde78b6dfdaa';
const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';

interface UseDataFetchingProps {
  activeView: 'plugins' | 'forum';
  activeCategory: string;
  searchQuery: string;
  setPlugins: (plugins: Plugin[]) => void;
  setCategories: (categories: Category[]) => void;
  setForumTopics: (topics: ForumTopic[]) => void;
}

export const useDataFetching = ({
  activeView,
  activeCategory,
  searchQuery,
  setPlugins,
  setCategories,
  setForumTopics
}: UseDataFetchingProps) => {
  const fetchPlugins = async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${BACKEND_URL}?${params}`);
      const data = await response.json();
      setPlugins(data.plugins || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const fetchForumTopics = async (pluginId?: number) => {
    try {
      const params = new URLSearchParams();
      if (pluginId) params.append('plugin_id', pluginId.toString());
      const response = await fetch(`${FORUM_URL}?${params}`);
      const data = await response.json();
      console.log('Forum topics loaded:', data.topics?.slice(0, 3).map((t: any) => ({ 
        id: t.id, 
        title: t.title, 
        created_at: t.created_at, 
        last_comment_at: t.last_comment_at 
      })));
      setForumTopics(data.topics || []);
    } catch (error) {
      console.error('Ошибка загрузки тем:', error);
    }
  };

  useEffect(() => {
    if (activeView === 'plugins') {
      fetchPlugins();
    } else if (activeView === 'forum') {
      fetchForumTopics();
    }
  }, [activeCategory, activeView]);

  return { fetchPlugins, fetchForumTopics };
};