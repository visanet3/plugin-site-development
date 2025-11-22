import { useEffect } from 'react';
import { Plugin, Category, ForumTopic, SearchResult, ForumComment } from '@/types';

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';

interface UseSearchHandlersProps {
  searchQuery: string;
  plugins: Plugin[];
  categories: Category[];
  forumTopics: ForumTopic[];
  setSearchResults: (results: SearchResult[]) => void;
  setShowSearchResults: (show: boolean) => void;
  setActiveView: (view: 'plugins' | 'forum') => void;
  setActiveCategory: (category: string) => void;
  setSelectedTopic: (topic: ForumTopic | null) => void;
  setTopicComments: (comments: ForumComment[]) => void;
}

export const useSearchHandlers = ({
  searchQuery,
  plugins,
  categories,
  forumTopics,
  setSearchResults,
  setShowSearchResults,
  setActiveView,
  setActiveCategory,
  setSelectedTopic,
  setTopicComments
}: UseSearchHandlersProps) => {
  const handleSearch = async () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results: SearchResult[] = [];

    plugins.forEach(plugin => {
      if (plugin.title.toLowerCase().includes(query) || 
          plugin.description.toLowerCase().includes(query) ||
          plugin.tags.some(tag => tag.toLowerCase().includes(query))) {
        results.push({
          type: 'plugin',
          id: plugin.id,
          title: plugin.title,
          description: plugin.description
        });
      }
    });

    categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(query)) {
        results.push({
          type: 'category',
          id: cat.id,
          title: cat.name,
          description: `Категория: ${cat.name}`
        });
      }
    });

    forumTopics.forEach(topic => {
      if (topic.title.toLowerCase().includes(query) || 
          topic.content?.toLowerCase().includes(query)) {
        results.push({
          type: 'topic',
          id: topic.id,
          title: topic.title,
          description: topic.content?.substring(0, 100)
        });
      }
    });

    setSearchResults(results.slice(0, 10));
    setShowSearchResults(true);
  };

  const handleSearchResultClick = async (result: SearchResult) => {
    setShowSearchResults(false);
    
    if (result.type === 'plugin') {
      setActiveView('plugins');
      setActiveCategory('plugins');
    } else if (result.type === 'category') {
      const category = categories.find(c => c.id === result.id);
      if (category) {
        setActiveView('plugins');
        setActiveCategory(category.slug);
      }
    } else if (result.type === 'topic') {
      setActiveView('forum');
      const topic = forumTopics.find(t => t.id === result.id);
      if (topic) {
        setSelectedTopic(topic);
        try {
          const response = await fetch(`${FORUM_URL}?topic_id=${topic.id}`);
          const data = await response.json();
          setTopicComments(data.comments || []);
        } catch (error) {
          console.error('Ошибка загрузки комментариев:', error);
        }
      }
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  return {
    handleSearch,
    handleSearchResultClick
  };
};
