import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Category } from '@/types';
import GitCryptoLogo from '@/components/GitCryptoLogo';

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
  onToggleSidebar,
}: SidebarProps) => {
  return (
    <>
      {/* Оверлей для мобильных */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden animate-fade-in"
          onClick={onToggleSidebar}
        />
      )}
      
      <aside className={`fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30 overflow-hidden ${sidebarOpen ? 'w-64' : 'w-0'} md:z-30`}>
        <div className={`p-4 w-64 transition-opacity duration-300 overflow-y-auto h-full ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
          {/* Кнопка закрытия для мобильных */}
          <div className="flex items-center justify-center mb-6 md:hidden relative">
            <h1 className="text-xl font-bold bg-gradient-to-r from-zinc-300 via-zinc-600 to-zinc-900 bg-clip-text text-transparent tracking-wide animate-gradient-x bg-[length:200%_auto]">
              Git Crypto
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-8 w-8 absolute right-0"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>
          
          {/* Заголовок для десктопа */}
          <div className="mb-8 justify-center hidden md:flex">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-300 via-zinc-600 to-zinc-900 bg-clip-text text-transparent tracking-wide animate-gradient-x bg-[length:200%_auto]">
              Git Crypto
            </h1>
          </div>

        <nav className="space-y-1">
          {[
            { icon: 'Home', label: 'Главная', id: 'all', view: 'plugins' },
            { icon: 'Zap', label: 'Flash USDT', id: 'categories', view: 'plugins' },
            { icon: 'Spade', label: 'Казино', id: 'new', view: 'plugins' },
            { icon: 'TrendingUp', label: 'Гарант сервис', id: 'popular', view: 'plugins' },
            { icon: 'FileCode', label: 'Смарт-контракты', id: 'smart-contracts', view: 'plugins' },
            { icon: 'MessageSquare', label: 'Форум', id: 'forum', view: 'forum' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                onCategoryChange(item.id, item.view as 'plugins' | 'forum');
                if (window.innerWidth < 768 && onToggleSidebar) {
                  onToggleSidebar();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 tap-highlight ${
                (activeView === item.view && (item.view === 'forum' || activeCategory === item.id)) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70'
              }`}
            >
              <Icon name={item.icon as any} size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
          
          {user && (
            <>
              <button
                onClick={() => {
                  onShowMessagesPanel?.();
                  if (window.innerWidth < 768 && onToggleSidebar) {
                    onToggleSidebar();
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 tap-highlight hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70 mt-4 relative"
              >
                <Icon name="Mail" size={18} />
                <span className="text-sm font-medium">Сообщения</span>
                {messagesUnread > 0 && (
                  <span className="absolute right-4 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {messagesUnread}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  onShowProfileDialog();
                  if (window.innerWidth < 768 && onToggleSidebar) {
                    onToggleSidebar();
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 tap-highlight hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70"
              >
                <Icon name="User" size={18} />
                <span className="text-sm font-medium">Личный кабинет</span>
              </button>
              <button
                onClick={() => {
                  onCategoryChange('rules', 'plugins');
                  if (window.innerWidth < 768 && onToggleSidebar) {
                    onToggleSidebar();
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 tap-highlight ${
                  activeCategory === 'rules' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70'
                }`}
              >
                <Icon name="BookOpen" size={18} />
                <span className="text-sm font-medium">Правила</span>
              </button>
              {user.role === 'admin' && (
                <div className="mt-2 pt-2 border-t border-sidebar-border/50">
                  <div className="px-4 py-1 mb-1">
                    <span className="text-xs font-semibold text-primary">АДМИНИСТРАТОР</span>
                  </div>
                  <button
                    onClick={() => {
                      onShowAdminPanel?.();
                      if (window.innerWidth < 768 && onToggleSidebar) {
                        onToggleSidebar();
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 tap-highlight hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70 bg-primary/10 border border-primary/30"
                  >
                    <Icon name="Shield" size={18} className="text-primary" />
                    <span className="text-sm font-medium text-primary">Админ-панель</span>
                  </button>
                </div>
              )}
            </>
          )}
        </nav>

        <div className="mt-8 pt-8 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground px-4 mb-3">ДРУГОЕ</p>
          {[
            { slug: 'faq', name: 'FAQ', icon: 'HelpCircle' },
            { slug: 'support', name: 'Поддержка', icon: 'MessageCircle' },
            { slug: 'terms', name: 'Условия пользования', icon: 'FileText' }
          ].map(item => (
            <button
              key={item.slug}
              onClick={() => {
                onCategoryChange(item.slug, 'plugins');
                if (window.innerWidth < 768 && onToggleSidebar) {
                  onToggleSidebar();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 tap-highlight text-sm ${
                activeCategory === item.slug ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70'
              }`}
              data-support-link={item.slug === 'flash' ? 'true' : undefined}
            >
              <Icon name={item.icon as any} size={16} />
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;