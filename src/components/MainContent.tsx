import { Plugin, Category, ForumTopic, ForumComment, User } from '@/types';
import { PluginsView } from './MainContent/PluginsView';
import { ForumTopicsList } from './MainContent/ForumTopicsList';
import { ForumTopicDetail } from './MainContent/ForumTopicDetail';
import { EscrowView } from './EscrowView';
import CasinoHub from './CasinoHub';
import FlashUsdtShop from './FlashUsdtShop';
import FAQPage from './FAQPage';
import SupportPage from './SupportPage';
import TermsPage from './TermsPage';
import RulesPage from './RulesPage';
import SmartContractsPage from './SmartContractsPage';

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
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
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
  onShowAuthDialog,
  onRefreshUserBalance,
}: MainContentProps) => {
  return (
    <main className="p-2 sm:p-3 md:p-4 lg:p-6 animate-fade-in max-w-full overflow-x-hidden">
      {activeView === 'plugins' ? (
        activeCategory === 'rules' ? (
          <RulesPage />
        ) : activeCategory === 'faq' ? (
          <FAQPage />
        ) : activeCategory === 'support' ? (
          <SupportPage user={user} onShowAuthDialog={onShowAuthDialog} />
        ) : activeCategory === 'terms' ? (
          <TermsPage />
        ) : activeCategory === 'smart-contracts' ? (
          <SmartContractsPage user={user} />
        ) : activeCategory === 'popular' ? (
          <EscrowView 
            user={user} 
            onShowAuthDialog={onShowAuthDialog} 
            onRefreshUserBalance={onRefreshUserBalance}
          />
        ) : activeCategory === 'new' ? (
          <CasinoHub
            user={user}
            onShowAuthDialog={onShowAuthDialog}
            onRefreshUserBalance={onRefreshUserBalance}
          />
        ) : activeCategory === 'categories' ? (
          <FlashUsdtShop 
            user={user} 
            onShowAuthDialog={onShowAuthDialog}
            onRefreshUserBalance={onRefreshUserBalance}
          />
        ) : (
          <PluginsView
            activeCategory={activeCategory}
            plugins={plugins}
            categories={categories}
            onNavigateToForum={onNavigateToForum}
          />
        )
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