import { memo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MainContent from '@/components/MainContent';
import { Plugin, Category, User, ForumTopic, ForumComment, SearchResult } from '@/types';

interface IndexLayoutProps {
  sidebarOpen: boolean;
  authDialogOpen: boolean;
  activeCategory: string;
  activeView: 'plugins' | 'forum';
  categories: Category[];
  user: User | null;
  messagesUnread: number;
  adminNotificationsUnread: number;
  searchQuery: string;
  searchResults: SearchResult[];
  showSearchResults: boolean;
  notificationsUnread: number;
  plugins: Plugin[];
  forumTopics: ForumTopic[];
  selectedTopic: ForumTopic | null;
  topicComments: ForumComment[];
  newComment: string;
  onToggleSidebar: () => void;
  onCategoryChange: (category: string, view: 'plugins' | 'forum') => void;
  onShowProfileDialog: () => void;
  onShowAdminPanel: () => void;
  onShowMessagesPanel: () => void;
  onSearchChange: (query: string) => void;
  onSearchFocus: () => void;
  onSearchResultClick: (result: SearchResult) => void;
  onAuthDialogOpen: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onShowNotifications: () => void;
  onShowProfile: () => void;
  onShowTopicDialog: () => void;
  onTopicSelect: (topic: ForumTopic) => void;
  onBackToTopics: () => void;
  onCommentChange: (comment: string) => void;
  onCreateComment: () => void;
  onUserClick: (userId: number) => void;
  onNavigateToForum: () => void;
  onNavigateToFlashUsdt: () => void;
  onShowAuthDialog: () => void;
  onRefreshUserBalance: () => void;
  onNavigateToVipTon: () => void;
}

const IndexLayout = ({
  sidebarOpen,
  authDialogOpen,
  activeCategory,
  activeView,
  categories,
  user,
  messagesUnread,
  adminNotificationsUnread,
  searchQuery,
  searchResults,
  showSearchResults,
  notificationsUnread,
  plugins,
  forumTopics,
  selectedTopic,
  topicComments,
  newComment,
  onToggleSidebar,
  onCategoryChange,
  onShowProfileDialog,
  onShowAdminPanel,
  onShowMessagesPanel,
  onSearchChange,
  onSearchFocus,
  onSearchResultClick,
  onAuthDialogOpen,
  onLogout,
  onShowNotifications,
  onShowProfile,
  onShowTopicDialog,
  onTopicSelect,
  onBackToTopics,
  onCommentChange,
  onCreateComment,
  onUserClick,
  onNavigateToForum,
  onNavigateToFlashUsdt,
  onShowAuthDialog,
  onRefreshUserBalance,
  onNavigateToVipTon
}: IndexLayoutProps) => {
  return (
    <>
      <Sidebar
        sidebarOpen={sidebarOpen && !authDialogOpen}
        activeCategory={activeCategory}
        activeView={activeView}
        categories={categories}
        user={user || undefined}
        onCategoryChange={onCategoryChange}
        onShowProfileDialog={onShowProfileDialog}
        onShowAdminPanel={onShowAdminPanel}
        onShowMessagesPanel={onShowMessagesPanel}
        messagesUnread={messagesUnread}
        adminNotificationsUnread={adminNotificationsUnread}
        onToggleSidebar={onToggleSidebar}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen && !authDialogOpen ? 'md:ml-64' : 'ml-0'} max-w-full overflow-x-hidden`}>
        <Header
          sidebarOpen={sidebarOpen}
          searchQuery={searchQuery}
          searchResults={searchResults}
          showSearchResults={showSearchResults}
          user={user}
          onToggleSidebar={onToggleSidebar}
          onSearchChange={onSearchChange}
          onSearchFocus={onSearchFocus}
          onSearchResultClick={onSearchResultClick}
          onAuthDialogOpen={onAuthDialogOpen}
          onLogout={onLogout}
          notificationsUnread={notificationsUnread}
          onShowNotifications={onShowNotifications}
          onShowProfile={onShowProfile}
          onNavigateToVipTon={onNavigateToVipTon}
        />

        <MainContent
          activeView={authDialogOpen ? 'plugins' : activeView}
          activeCategory={authDialogOpen ? 'all' : activeCategory}
          plugins={plugins}
          categories={categories}
          forumTopics={forumTopics}
          selectedTopic={selectedTopic}
          topicComments={topicComments}
          user={user}
          newComment={newComment}
          onShowTopicDialog={onShowTopicDialog}
          onTopicSelect={onTopicSelect}
          onBackToTopics={onBackToTopics}
          onCommentChange={onCommentChange}
          onCreateComment={onCreateComment}
          onUserClick={onUserClick}
          onNavigateToForum={onNavigateToForum}
          onNavigateToFlashUsdt={onNavigateToFlashUsdt}
          onShowAuthDialog={onShowAuthDialog}
          onRefreshUserBalance={onRefreshUserBalance}
        />
      </div>
    </>
  );
};

export default memo(IndexLayout);