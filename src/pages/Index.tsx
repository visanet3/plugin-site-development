import { useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useIndexState } from './index/IndexState';
import { useIndexHandlers } from './index/IndexHandlers';
import IndexLayout from './index/IndexLayout';
import { CookieConsent } from '@/components/CookieConsent';
import { userSyncManager } from '@/utils/userSync';

const AdminPanel = lazy(() => import('@/components/AdminPanel'));
const UserProfileDialog = lazy(() => import('@/components/UserProfileDialog'));
const UserProfile = lazy(() => import('@/components/UserProfile'));
const MessagesPanel = lazy(() => import('@/components/MessagesPanel'));
const NotificationsPanel = lazy(() => import('@/components/NotificationsPanel'));
const DDoSMonitor = lazy(() => import('@/components/DDoSMonitor'));
const Dialogs = lazy(() => import('@/components/Dialogs'));

const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';

const Index = () => {
  const navigate = useNavigate();
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
      userSyncManager.syncUser(false).then(syncedUser => {
        if (syncedUser === null) {
          navigate('/auth');
          state.toast({
            title: '🚫 Аккаунт заблокирован',
            description: 'Ваш аккаунт был заблокирован администратором',
            variant: 'destructive',
            duration: 10000
          });
        } else if (syncedUser) {
          state.setUser(syncedUser);
        }
      });
    } else {
      navigate('/auth');
    }
    
    const unsubscribe = userSyncManager.subscribe((user) => {
      if (user === null) {
        navigate('/auth');
      } else if (user) {
        state.setUser(user);
      }
    });
    
    const handleVisibilityChange = () => {
      if (!document.hidden && localStorage.getItem('user')) {
        userSyncManager.triggerSync();
      }
    };
    
    const handleFocus = () => {
      if (localStorage.getItem('user')) {
        userSyncManager.triggerSync();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
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
      unsubscribe();
      window.removeEventListener('beforeunload', saveScrollPosition);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
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

  // Получаем текущий URL с реферальным кодом если есть
  const currentUrl = window.location.href;
  const ogImage = 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/og-image-1763925008534.jpg';

  return (
    <>
      <Helmet>
        <meta property="og:url" content={currentUrl} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:url" content={currentUrl} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground flex relative" onClick={() => state.setShowSearchResults(false)}>
      {state.showAdminPanel && state.user?.role === 'admin' ? (
        <Suspense fallback={<div className="flex items-center justify-center h-screen w-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
          <AdminPanel currentUser={state.user} onClose={() => state.setShowAdminPanel(false)} />
        </Suspense>
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

          <Suspense fallback={null}>
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
              onTopicCreated={handlers.refreshForumTopics}
            />
          </Suspense>

          <Suspense fallback={null}>
            {state.showUserProfile && state.selectedUserId && state.user && state.selectedUserId === state.user.id ? (
              <UserProfile
                user={state.user}
                isOwnProfile={true}
                onClose={() => state.setShowUserProfile(false)}
                onTopUpBalance={handlers.handleTopUpBalance}
                onUpdateProfile={handlers.handleUpdateProfile}
                onRefreshBalance={handlers.refreshUserBalance}
                onShowUserTopics={(userId, username) => {
                  state.setActiveView('forum');
                  state.setActiveCategory('user-topics');
                  localStorage.setItem('userTopicsFilter', JSON.stringify({ userId, username }));
                  state.setShowUserProfile(false);
                  state.setSelectedTopic(null);
                  localStorage.removeItem('selectedTopicId');
                }}
              />
            ) : (
              <UserProfileDialog
                open={state.showUserProfile}
                onOpenChange={state.setShowUserProfile}
                userId={state.selectedUserId}
                currentUserId={state.user?.id}
                onSendMessage={handlers.handleSendMessage}
                onShowUserTopics={(userId, username) => {
                  state.setActiveView('forum');
                  state.setActiveCategory('user-topics');
                  localStorage.setItem('userTopicsFilter', JSON.stringify({ userId, username }));
                  state.setShowUserProfile(false);
                  state.setSelectedTopic(null);
                  localStorage.removeItem('selectedTopicId');
                }}
              />
            )}
          </Suspense>

          {state.user && (
            <Suspense fallback={null}>
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
                userRole={state.user.role}
                initialRecipientId={state.messageRecipientId}
                onUserClick={handlers.handleUserClick}
              />
            </Suspense>
          )}
        </>
      )}

      {!state.user && (
        <>
          <div className="fixed inset-0 backdrop-blur-[2px] bg-background/9 z-[30] pointer-events-none" />
          <div className="fixed inset-0 z-[40] flex items-center justify-center p-4">
            <div className="bg-background/95 backdrop-blur-xl border-2 border-primary/50 rounded-2xl shadow-2xl max-w-md w-full">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
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
                onAuthDialogAttemptClose={handlers.handleAuthDialogAttemptClose}
              />
              </Suspense>
            </div>
          </div>
        </>
      )}

      {state.user && (
        <Suspense fallback={null}>
          <DDoSMonitor currentUser={state.user} />
        </Suspense>
      )}

      <CookieConsent isAuthenticated={!!state.user} />
    </div>
    </>
  );
};

export default Index;