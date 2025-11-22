import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Category } from '@/types';

interface SidebarProps {
  sidebarOpen: boolean;
  activeCategory: string;
  activeView: 'plugins' | 'forum';
  categories: Category[];
  user: { id: number; username: string; email: string; role?: string } | null;
  onCategoryChange: (category: string, view: 'plugins' | 'forum') => void;
  onShowProfileDialog: () => void;
  onShowAdminPanel?: () => void;
  onShowMessagesPanel?: () => void;
  unreadCount?: number;
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
  unreadCount = 0,
}: SidebarProps) => {
  return (
    <aside className={`fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30 ${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'}`}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Icon name="Layers" size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold">ТП</span>
        </div>

        <nav className="space-y-1">
          {[
            { icon: 'Home', label: 'Главная', id: 'all', view: 'plugins' },
            { icon: 'Grid3x3', label: 'Категории', id: 'categories', view: 'plugins' },
            { icon: 'Sparkles', label: 'Новинки', id: 'new', view: 'plugins' },
            { icon: 'TrendingUp', label: 'Популярное', id: 'popular', view: 'plugins' },
            { icon: 'MessageSquare', label: 'Форум', id: 'forum', view: 'forum' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onCategoryChange(item.id, item.view as 'plugins' | 'forum')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                (activeView === item.view && (item.view === 'forum' || activeCategory === item.id)) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon name={item.icon as any} size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
          
          {user && (
            <>
              <button
                onClick={onShowMessagesPanel}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors hover:bg-sidebar-accent/50 mt-4 relative"
              >
                <Icon name="Mail" size={18} />
                <span className="text-sm font-medium">Сообщения</span>
                {unreadCount > 0 && (
                  <span className="absolute right-4 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={onShowProfileDialog}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors hover:bg-sidebar-accent/50"
              >
                <Icon name="User" size={18} />
                <span className="text-sm font-medium">Личный кабинет</span>
              </button>
              {user.role === 'admin' && (
                <div className="mt-2 pt-2 border-t border-sidebar-border/50">
                  <div className="px-4 py-1 mb-1">
                    <span className="text-xs font-semibold text-primary">АДМИНИСТРАТОР</span>
                  </div>
                  <button
                    onClick={onShowAdminPanel}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors hover:bg-sidebar-accent/50 bg-primary/10 border border-primary/30"
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
          <p className="text-xs text-muted-foreground px-4 mb-3">КАТЕГОРИИ</p>
          {categories.slice(0, 5).map(cat => (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(cat.slug, 'plugins')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                activeCategory === cat.slug ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/50'
              }`}
            >
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${cat.color}`} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;