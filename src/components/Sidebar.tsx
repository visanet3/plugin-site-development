import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Category } from '@/types';
import GitCryptoLogo from '@/components/GitCryptoLogo';
import { AnimatedMenuButton } from '@/components/ui/animated-menu-button';

interface SidebarProps {
  sidebarOpen: boolean;
  activeCategory: string;
  activeView: 'plugins' | 'forum';
  categories: Category[];
  user?: { id: number; username: string; email: string; role?: string } | null;
  onCategoryChange: (category: string, view: 'plugins' | 'forum') => void;
  onShowProfileDialog: () => void;
  onShowAdminPanel?: () => void;
  onShowMessagesPanel?: () => void;
  messagesUnread?: number;
  adminNotificationsUnread?: number;
  onToggleSidebar?: () => void;
}

const Sidebar = ({
  sidebarOpen,
  activeCategory,
  activeView,
  categories,
  user,
  onCategoryChange,
  onShowProfileDialog,
  onShowAdminPanel,
  onShowMessagesPanel,
  messagesUnread = 0,
  adminNotificationsUnread = 0,
  onToggleSidebar,
}: SidebarProps) => {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  
  return (
    <>
      {/* Оверлей для мобильных */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden animate-fade-in"
          onClick={onToggleSidebar}
        />
      )}
      
      <aside className={`fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30 overflow-hidden flex flex-col ${sidebarOpen ? 'w-64' : 'w-0'} md:z-30`}>
        <div className={`w-64 transition-opacity duration-300 flex flex-col h-full ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
          {/* Кнопка закрытия для мобильных */}
          <div className="flex items-center justify-center py-3 px-4 md:hidden relative shrink-0">
            <h1 className="text-lg font-bold bg-gradient-to-r from-zinc-300 via-zinc-600 to-zinc-900 bg-clip-text text-transparent tracking-wide animate-gradient-x bg-[length:200%_auto] mr-8">
              Git Crypto
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-8 w-8 absolute right-2"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>
          
          {/* Заголовок для десктопа */}
          <div className="py-6 justify-center hidden md:flex shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-300 via-zinc-600 to-zinc-900 bg-clip-text text-transparent tracking-wide animate-gradient-x bg-[length:200%_auto]">
              Git Crypto
            </h1>
          </div>

        {/* Основная навигация с прокруткой */}
        <nav className="space-y-0.5 md:space-y-1 px-3 md:px-4 overflow-y-auto flex-1">
          {[
            { icon: 'Home', label: 'Главная', id: 'all', view: 'plugins' },
            { icon: 'Zap', label: 'Flash USDT', id: 'categories', view: 'plugins' },
            { icon: 'Bitcoin', label: 'Flash BTC', id: 'flash-btc', view: 'plugins' },
            { icon: 'ShieldCheck', label: 'Гарант-сервис', id: 'deals', view: 'plugins' },
            { icon: 'ArrowLeftRight', label: 'Обменник', id: 'exchange', view: 'plugins' },
            { icon: 'FileCode', label: 'Смарт-контракты', id: 'smart-contracts', view: 'plugins' },
            { icon: 'GraduationCap', label: 'Обучающий центр', id: 'learning', view: 'plugins' },
            { icon: 'MessageSquare', label: 'Форум', id: 'forum', view: 'forum' },
          ].map(item => (
            <AnimatedMenuButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.view && (item.view === 'forum' || activeCategory === item.id)}
              onClick={() => {
                onCategoryChange(item.id, item.view as 'plugins' | 'forum');
                if (window.innerWidth < 768 && onToggleSidebar) {
                  onToggleSidebar();
                }
              }}
            />
          ))}
          
          {user && (
            <>
              <div className="border-t border-sidebar-border/50 mt-1 md:mt-2 pt-1 md:pt-2">
                <AnimatedMenuButton
                  icon="Mail"
                  label="Сообщения"
                  isActive={false}
                  badge={messagesUnread}
                  onClick={() => {
                    onShowMessagesPanel?.();
                    if (window.innerWidth < 768 && onToggleSidebar) {
                      onToggleSidebar();
                    }
                  }}
                />
                <AnimatedMenuButton
                  icon="User"
                  label="Личный кабинет"
                  isActive={false}
                  onClick={() => {
                    onShowProfileDialog();
                    if (window.innerWidth < 768 && onToggleSidebar) {
                      onToggleSidebar();
                    }
                  }}
                />
                <AnimatedMenuButton
                  icon="BookOpen"
                  label="Правила"
                  isActive={activeCategory === 'rules'}
                  onClick={() => {
                    onCategoryChange('rules', 'plugins');
                    if (window.innerWidth < 768 && onToggleSidebar) {
                      onToggleSidebar();
                    }
                  }}
                />
              </div>
              {user.role === 'admin' && (
                <div className="mt-1 md:mt-2 pt-1 md:pt-2 border-t border-sidebar-border/50">
                  <div className="px-3 md:px-4 py-0.5 md:py-1 mb-0.5 md:mb-1">
                    <span className="text-[10px] md:text-xs font-semibold text-primary">АДМИНИСТРАТОР</span>
                  </div>
                  <AnimatedMenuButton
                    icon="Shield"
                    label="Админ-панель"
                    isActive={false}
                    badge={adminNotificationsUnread}
                    variant="admin"
                    onClick={() => {
                      onShowAdminPanel?.();
                      if (window.innerWidth < 768 && onToggleSidebar) {
                        onToggleSidebar();
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </nav>

        {/* Блок "ДРУГОЕ" - всегда внизу */}
        <div className="shrink-0 border-t border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm">
          <div className="px-3 md:px-4 py-2 md:py-3 space-y-0.5">
            <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mb-1 md:mb-2 px-1">ДРУГОЕ</p>
            {[
              { slug: 'referral-program', name: 'Реферальная система', icon: 'Users' },
              { slug: 'faq', name: 'FAQ', icon: 'HelpCircle' },
              { slug: 'support', name: 'Поддержка', icon: 'MessageCircle' },
              ...(user ? [{ slug: 'my-tickets', name: 'Мои обращения', icon: 'Inbox' }] : []),
              { slug: 'terms', name: 'Условия пользования', icon: 'FileText' },
              { slug: 'about', name: 'О нас', icon: 'Info' }
            ].map(item => (
              <button
                key={item.slug}
                onClick={() => {
                  onCategoryChange(item.slug, 'plugins');
                  if (window.innerWidth < 768 && onToggleSidebar) {
                    onToggleSidebar();
                  }
                }}
                className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-all duration-200 tap-highlight ${
                  activeCategory === item.slug ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70'
                }`}
                data-support-link={item.slug === 'flash' ? 'true' : undefined}
              >
                <Icon name={item.icon as any} size={14} className="md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;