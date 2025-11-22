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

    const keywords = query.split(/\s+/).filter(word => word.length > 0);
    
    const matchesKeywords = (text: string): number => {
      const lowerText = text.toLowerCase();
      let matchCount = 0;
      
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          matchCount++;
        }
      });
      
      return matchCount;
    };

    const resultsWithScore: Array<SearchResult & { score: number }> = [];

    plugins.forEach(plugin => {
      const titleScore = matchesKeywords(plugin.title) * 3;
      const descScore = matchesKeywords(plugin.description);
      const tagsScore = plugin.tags.reduce((sum, tag) => sum + matchesKeywords(tag) * 2, 0);
      const totalScore = titleScore + descScore + tagsScore;
      
      if (totalScore > 0) {
        resultsWithScore.push({
          type: 'plugin',
          id: plugin.id,
          title: plugin.title,
          description: plugin.description,
          score: totalScore
        });
      }
    });

    categories.forEach(cat => {
      const score = matchesKeywords(cat.name) * 2;
      if (score > 0) {
        resultsWithScore.push({
          type: 'category',
          id: cat.id,
          title: cat.name,
          description: `Категория: ${cat.name}`,
          score: score
        });
      }
    });

    forumTopics.forEach(topic => {
      const titleScore = matchesKeywords(topic.title) * 3;
      const contentScore = topic.content ? matchesKeywords(topic.content) : 0;
      const totalScore = titleScore + contentScore;
      
      if (totalScore > 0) {
        resultsWithScore.push({
          type: 'topic',
          id: topic.id,
          title: topic.title,
          description: topic.content?.substring(0, 100),
          score: totalScore
        });
      }
    });

    resultsWithScore.sort((a, b) => b.score - a.score);
    
    const results = resultsWithScore.map(({ score, ...rest }) => rest);
    setSearchResults(results.slice(0, 20));
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
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  return {
    handleSearch,
    handleSearchResultClick
  };
};