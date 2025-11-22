import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User, SearchResult } from '@/types';

interface HeaderProps {
  sidebarOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  showSearchResults: boolean;
  user: User | null;
  onToggleSidebar: () => void;
  onSearchChange: (query: string) => void;
  onSearchFocus: () => void;
  onSearchResultClick: (result: SearchResult) => void;
  onAuthDialogOpen: (mode: 'login' | 'register') => void;
  onLogout: () => void;
}

const Header = ({
  sidebarOpen,
  searchQuery,
  searchResults,
  showSearchResults,
  user,
  onToggleSidebar,
  onSearchChange,
  onSearchFocus,
  onSearchResultClick,
  onAuthDialogOpen,
  onLogout,
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-20 bg-card border-b border-border backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            <Icon name="Menu" size={20} />
          </Button>

          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Поиск по сайту..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onSearchFocus}
              className="pl-10 bg-secondary border-0"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchResultClick(result);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-sidebar-accent transition-colors border-b border-border last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {result.type === 'plugin' && <Icon name="Package" size={16} className="text-primary" />}
                        {result.type === 'topic' && <Icon name="MessageSquare" size={16} className="text-accent" />}
                        {result.type === 'category' && <Icon name="Grid3x3" size={16} className="text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {result.type === 'plugin' ? 'Плагин' : result.type === 'topic' ? 'Тема' : 'Категория'}
                          </Badge>
                          <span className="font-medium text-sm truncate">{result.title}</span>
                        </div>
                        {result.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{result.description}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-4 z-50">
                <p className="text-sm text-muted-foreground text-center">Ничего не найдено</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="icon">
                <Icon name="Bell" size={20} />
              </Button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  Выход
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => onAuthDialogOpen('login')}
                variant="outline"
                className="font-semibold px-6"
              >
                ВХОД
              </Button>
              <Button 
                onClick={() => onAuthDialogOpen('register')}
                className="bg-primary hover:bg-primary/90 font-semibold px-6"
              >
                РЕГИСТРАЦИЯ
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;