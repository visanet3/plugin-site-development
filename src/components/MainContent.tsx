import { Plugin, Category, ForumTopic, ForumComment, User } from '@/types';
import { PluginsView } from './MainContent/PluginsView';
import { ForumTopicsList } from './MainContent/ForumTopicsList';
import { ForumTopicDetail } from './MainContent/ForumTopicDetail';

interface MainContentProps {
  activeView: 'plugins' | 'forum';
  activeCategory: string;
  plugins: Plugin[];
  categories: Category[];
  forumTopics: ForumTopic[];
  selectedTopic: ForumTopic | null;
  topicComments: ForumComment[];
  user: User | null;
  newComment: string;
  onShowTopicDialog: () => void;
  onTopicSelect: (topic: ForumTopic) => void;
  onBackToTopics: () => void;
  onCommentChange: (comment: string) => void;
  onCreateComment: () => void;
  onUserClick: (userId: number) => void;
  onNavigateToForum?: () => void;
}

const MainContent = ({
  activeView,
  activeCategory,
  plugins,
  categories,
  forumTopics,
  selectedTopic,
  topicComments,
  user,
  newComment,
  onShowTopicDialog,
  onTopicSelect,
  onBackToTopics,
  onCommentChange,
  onCreateComment,
  onUserClick,
  onNavigateToForum,
}: MainContentProps) => {
  return (
    <main className="p-6 animate-fade-in">
      {activeView === 'plugins' ? (
        <PluginsView
          activeCategory={activeCategory}
          plugins={plugins}
          categories={categories}
          onNavigateToForum={onNavigateToForum}
        />
      ) : selectedTopic ? (
        <ForumTopicDetail
          selectedTopic={selectedTopic}
          topicComments={topicComments}
          user={user}
          newComment={newComment}
          onBackToTopics={onBackToTopics}
          onCommentChange={onCommentChange}
          onCreateComment={onCreateComment}
          onUserClick={onUserClick}
        />
      ) : (
        <ForumTopicsList
          forumTopics={forumTopics}
          user={user}
          onShowTopicDialog={onShowTopicDialog}
          onTopicSelect={onTopicSelect}
          onUserClick={onUserClick}
        />
      )}
    </main>
  );
};

export default MainContent;
