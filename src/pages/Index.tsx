import { useEffect } from 'react';
import AdminPanel from '@/components/AdminPanel';
import UserProfileDialog from '@/components/UserProfileDialog';
import UserProfile from '@/components/UserProfile';
import MessagesPanel from '@/components/MessagesPanel';
import NotificationsPanel from '@/components/NotificationsPanel';
import DDoSMonitor from '@/components/DDoSMonitor';
import Dialogs from '@/components/Dialogs';
import { useIndexState } from './index/IndexState';
import { useIndexHandlers } from './index/IndexHandlers';
import IndexLayout from './index/IndexLayout';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';

const Index = () => {
  const state = useIndexState();

  const handlers = useIndexHandlers({
    user: state.user,
    setUser: state.setUser,
    authMode: state.authMode,
    setAuthDialogOpen: state.setAuthDialogOpen,
    setSelectedTopic: state.setSelectedTopic,
    setSelectedUserId: state.setSelectedUserId,
    setShowUserProfile: state.setShowUserProfile,
    setMessageRecipientId: state.setMessageRecipientId,
    setShowMessagesPanel: state.setShowMessagesPanel,
    setActiveView: state.setActiveView,
    setActiveCategory: state.setActiveCategory,
    toast: state.toast
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('referralCode', refCode.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      state.setUser(parsedUser);
      
      const syncUserData = async () => {
        try {
          const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': parsedUser.id.toString()
            },
            body: JSON.stringify({ action: 'get_user' })
          });
          const data = await response.json();
          if (data.success && data.user) {
            state.setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (error) {
          console.error('Ошибка синхронизации данных пользователя:', error);
        }
      };
      
      syncUserData();
    } else {
      state.setAuthDialogOpen(true);
      if (refCode) {
        state.setAuthMode('register');
      }
    }
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    const savedScrollPos = sessionStorage.getItem('scrollPosition');
    if (savedScrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos));
        sessionStorage.removeItem('scrollPosition');
      }, 100);
    }
    
    const saveScrollPosition = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };
    
    window.addEventListener('beforeunload', saveScrollPosition);
    
    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
    };
  }, []);

  useEffect(() => {
    const savedTopicId = localStorage.getItem('selectedTopicId');
    if (savedTopicId && state.activeView === 'forum' && state.forumTopics.length > 0 && !state.selectedTopic) {
      const topic = state.forumTopics.find(t => t.id === parseInt(savedTopicId));
      if (topic) {
        state.handleTopicSelect(topic);
      }
    }
  }, [state.forumTopics, state.activeView]);

  return (
    <div className="min-h-screen bg-background text-foreground flex relative" onClick={() => state.setShowSearchResults(false)}>
      {state.showAdminPanel && state.user?.role === 'admin' ? (
        <AdminPanel currentUser={state.user} onClose={() => state.setShowAdminPanel(false)} />
      ) : (
        <>
          <IndexLayout 
            sidebarOpen={state.sidebarOpen}
            authDialogOpen={state.authDialogOpen}
            activeCategory={state.activeCategory}
            activeView={state.activeView}
            categories={state.categories}
            user={state.user}
            messagesUnread={state.messagesUnread}
            adminNotificationsUnread={state.adminNotificationsUnread}
            searchQuery={state.searchQuery}
            searchResults={state.searchResults}
            showSearchResults={state.showSearchResults}
            notificationsUnread={state.notificationsUnread}
            plugins={state.plugins}
            forumTopics={state.forumTopics}
            selectedTopic={state.selectedTopic}
            topicComments={state.topicComments}
            newComment={state.newComment}
            onToggleSidebar={() => state.setSidebarOpen(!state.sidebarOpen)}
            onCategoryChange={handlers.handleCategoryChange}
            onShowProfileDialog={() => {
              if (state.user) {
                state.setSelectedUserId(state.user.id);
                state.setShowUserProfile(true);
              }
            }}
            onShowAdminPanel={() => state.setShowAdminPanel(true)}
            onShowMessagesPanel={() => state.setShowMessagesPanel(true)}
            onSearchChange={state.setSearchQuery}
            onSearchFocus={() => state.searchQuery && state.setShowSearchResults(true)}
            onSearchResultClick={state.handleSearchResultClick}
            onAuthDialogOpen={(mode) => {
              state.setAuthMode(mode);
              state.setAuthDialogOpen(true);
            }}
            onLogout={handlers.handleLogout}
            onShowNotifications={() => state.setShowNotificationsPanel(true)}
            onShowProfile={() => {
              if (state.user) {
                state.setSelectedUserId(state.user.id);
                state.setShowUserProfile(true);
              }
            }}
            onShowTopicDialog={() => state.setShowTopicDialog(true)}
            onTopicSelect={state.handleTopicSelect}
            onBackToTopics={() => {
              state.setSelectedTopic(null);
              localStorage.removeItem('selectedTopicId');
            }}
            onCommentChange={state.setNewComment}
            onCreateComment={state.handleCreateComment}
            onUserClick={handlers.handleUserClick}
            onNavigateToForum={() => state.setActiveView('forum')}
            onShowAuthDialog={() => state.setAuthDialogOpen(true)}
            onRefreshUserBalance={handlers.refreshUserBalance}
          />

          <Dialogs
            authDialogOpen={state.authDialogOpen}
            authMode={state.authMode}
            showTopicDialog={state.showTopicDialog}
            showProfileDialog={state.showProfileDialog}
            user={state.user}
            newTopicTitle={state.newTopicTitle}
            newTopicContent={state.newTopicContent}
            onAuthDialogChange={state.setAuthDialogOpen}
            onAuthModeChange={state.setAuthMode}
            onAuthSubmit={handlers.handleAuth}
            onTopicDialogChange={state.setShowTopicDialog}
            onTopicTitleChange={state.setNewTopicTitle}
            onTopicContentChange={state.setNewTopicContent}
            onCreateTopic={state.handleCreateTopic}
            onProfileDialogChange={state.setShowProfileDialog}
            onUpdateProfile={handlers.handleUpdateProfile}
            onAuthDialogAttemptClose={handlers.handleAuthDialogAttemptClose}
          />

          {state.showUserProfile && state.selectedUserId && state.user && state.selectedUserId === state.user.id ? (
            <UserProfile
              user={state.user}
              isOwnProfile={true}
              onClose={() => state.setShowUserProfile(false)}
              onTopUpBalance={handlers.handleTopUpBalance}
              onUpdateProfile={handlers.handleUpdateProfile}
            />
          ) : (
            <UserProfileDialog
              open={state.showUserProfile}
              onOpenChange={state.setShowUserProfile}
              userId={state.selectedUserId}
              currentUserId={state.user?.id}
              onSendMessage={handlers.handleSendMessage}
            />
          )}

          {state.user && (
            <>
              <NotificationsPanel
                open={state.showNotificationsPanel}
                onOpenChange={(open) => {
                  state.setShowNotificationsPanel(open);
                  if (!open) {
                    fetch(`${NOTIFICATIONS_URL}?action=notifications`, {
                      headers: { 'X-User-Id': state.user!.id.toString() }
                    }).then(res => res.json()).then(data => {
                      state.setNotificationsUnread(data.unread_count || 0);
                    }).catch(() => {});
                  }
                }}
                userId={state.user.id}
              />
              
              <MessagesPanel
                open={state.showMessagesPanel}
                onOpenChange={(open) => {
                  state.setShowMessagesPanel(open);
                  if (!open) {
                    state.setMessageRecipientId(null);
                    fetch(`${NOTIFICATIONS_URL}?action=messages`, {
                      headers: { 'X-User-Id': state.user!.id.toString() }
                    }).then(res => res.json()).then(data => {
                      state.setMessagesUnread(data.unread_count || 0);
                    }).catch(() => {});
                  }
                }}
                userId={state.user.id}
                initialRecipientId={state.messageRecipientId}
              />
            </>
          )}
        </>
      )}

      {!state.user && (
        <>
          <div className="fixed inset-0 backdrop-blur-[2px] bg-background/9 z-40 pointer-events-none" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-background/95 backdrop-blur-xl border-2 border-primary/50 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
              <Dialogs
                authDialogOpen={true}
                authMode={state.authMode}
                showTopicDialog={false}
                showProfileDialog={false}
                user={null}
                newTopicTitle=""
                newTopicContent=""
                onAuthDialogChange={() => {}}
                onAuthModeChange={state.setAuthMode}
                onAuthSubmit={handlers.handleAuth}
                onTopicDialogChange={() => {}}
                onTopicTitleChange={() => {}}
                onTopicContentChange={() => {}}
                onCreateTopic={() => {}}
                onProfileDialogChange={() => {}}
                onUpdateProfile={() => {}}
              />
            </div>
          </div>
        </>
      )}

      {state.user && <DDoSMonitor currentUser={state.user} />}
    </div>
  );
};

export default Index;
