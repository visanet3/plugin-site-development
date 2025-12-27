import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User, SearchResult } from '@/types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  sidebarOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  showSearchResults: boolean;
  user: User | null;
  notificationsUnread?: number;
  onToggleSidebar: () => void;
  onSearchChange: (query: string) => void;
  onSearchFocus: () => void;
  onSearchResultClick: (result: SearchResult) => void;
  onAuthDialogOpen: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onShowNotifications?: () => void;
  onShowProfile?: () => void;
}

const Header = ({
  sidebarOpen,
  searchQuery,
  searchResults,
  showSearchResults,
  user,
  notificationsUnread = 0,
  onToggleSidebar,
  onSearchChange,
  onSearchFocus,
  onSearchResultClick,
  onAuthDialogOpen,
  onLogout,
  onShowNotifications,
  onShowProfile,
}: HeaderProps) => {
  const navigate = useNavigate();
  const [animatedBalance, setAnimatedBalance] = useState(Number(user?.balance) || 0);
  const [isBalanceChanging, setIsBalanceChanging] = useState(false);

  const highlightKeywords = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const keywords = query.trim().toLowerCase().split(/\s+/);
    let result: React.ReactNode[] = [text];
    
    keywords.forEach(keyword => {
      const newResult: React.ReactNode[] = [];
      result.forEach((part) => {
        if (typeof part === 'string') {
          const regex = new RegExp(`(${keyword})`, 'gi');
          const parts = part.split(regex);
          parts.forEach((p, i) => {
            if (p.toLowerCase() === keyword.toLowerCase()) {
              newResult.push(<span key={`${keyword}-${i}`} className="bg-primary/30 text-primary font-semibold">{p}</span>);
            } else if (p) {
              newResult.push(p);
            }
          });
        } else {
          newResult.push(part);
        }
      });
      result = newResult;
    });
    
    return result;
  };

  useEffect(() => {
    const currentBalance = Number(user?.balance) || 0;
    if (user && currentBalance !== animatedBalance) {
      setIsBalanceChanging(true);
      const duration = 800;
      const steps = 30;
      const stepValue = (currentBalance - animatedBalance) / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setAnimatedBalance(currentBalance);
          clearInterval(timer);
          setTimeout(() => setIsBalanceChanging(false), 300);
        } else {
          setAnimatedBalance(prev => prev + stepValue);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [user?.balance]);
  return (
    <header className="sticky top-0 z-20 bg-card border-b border-border backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="text-white hover:bg-orange-500/10 transition-colors shrink-0">
            <Icon name="Menu" size={20} />
          </Button>

          <div className="relative max-w-md w-full hidden sm:block" onClick={(e) => e.stopPropagation()}>
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Поиск по ключевым словам..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onSearchFocus}
              className="pl-10 bg-secondary border-0"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                <div className="px-4 py-2 bg-muted/50 border-b border-border sticky top-0">
                  <p className="text-xs text-muted-foreground">
                    Найдено результатов: <span className="font-semibold text-foreground">{searchResults.length}</span>
                  </p>
                </div>
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
                          <span className="font-medium text-sm truncate">{highlightKeywords(result.title, searchQuery)}</span>
                        </div>
                        {result.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{highlightKeywords(result.description, searchQuery)}</p>
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
              <div className="flex items-center gap-1.5 sm:gap-3">
                <button
                  onClick={() => navigate('/christmas-tree')}
                  className="relative group cursor-pointer"
                  title="Новогодняя акция! Получите бонус до 100%"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="relative bg-gradient-to-r from-red-600/20 to-green-600/20 hover:from-red-600/30 hover:to-green-600/30 border border-red-500/30 hover:border-yellow-500/50 rounded-lg px-3 sm:px-4 py-2 transition-all duration-200 group-hover:scale-105 backdrop-blur-sm shadow-md hover:shadow-lg hover:shadow-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-green-500 flex items-center justify-center shadow-sm p-1 sm:p-1.5 animate-pulse">
                          <span className="text-base sm:text-xl">🎄</span>
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm border border-background animate-ping"></div>
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm border border-background">
                          <span className="text-[8px]">🔥</span>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[9px] text-yellow-300/80 font-medium uppercase tracking-wide leading-none">🎁 Акция</p>
                        <p className="text-base font-semibold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent transition-all duration-300 leading-tight">
                          до 100%
                          <span className="text-[10px] ml-1 text-white/90 font-bold">БОНУС</span>
                        </p>
                      </div>
                      <div className="sm:hidden">
                        <p className="text-xs font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent leading-none">
                          100%
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={onShowProfile}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className={`relative bg-muted/50 hover:bg-muted/70 border border-border hover:border-green-500/30 rounded-lg px-3 sm:px-4 py-2 transition-all duration-200 ${isBalanceChanging ? 'scale-105 border-green-500/50' : 'scale-100'}`}>
                    <div className="flex items-center gap-2">
                      {/* USDT Logo with Tron Badge */}
                      <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                        {/* USDT Circle */}
                        <div className="w-full h-full rounded-full bg-[#26A17B] flex items-center justify-center shadow-sm p-1 sm:p-1.5">
                          <img 
                            src="https://cryptologos.cc/logos/tether-usdt-logo.svg" 
                            alt="USDT"
                            className="w-full h-full"
                          />
                        </div>
                        {/* Tron Logo Badge */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#FF060A] flex items-center justify-center shadow-sm border border-background p-0.5">
                          <svg viewBox="0 0 56 56" className="w-full h-full" fill="white">
                            <path d="M33.48 10.88l16.93 3.67-21.93 30.5L5.92 30.74l27.56-19.86zm-1.75 3.13L9.34 28.2l19.58 11.37 17.19-23.73-14.38-1.83zM28.48 15.53l1.82 10.8 8.62-11.85-10.44.05z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Баланс</p>
                        <p className={`text-base font-semibold text-foreground transition-all duration-300 ${isBalanceChanging ? 'text-green-400' : ''}`}>
                          {Number(animatedBalance).toFixed(2)}
                          <span className="text-xs ml-1 text-muted-foreground font-normal">USDT</span>
                        </p>
                      </div>
                      <div className="sm:hidden">
                        <p className={`text-sm font-semibold text-foreground transition-all duration-300 ${isBalanceChanging ? 'text-green-400' : ''}`}>
                          {Number(animatedBalance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>

                <Button 
                  variant="ghost" 
                  className="text-left flex items-center gap-1.5 sm:gap-3 text-white hover:bg-orange-500/10 transition-colors px-2 sm:px-4"
                  onClick={onShowProfile}
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white">{user.username}</p>
                  </div>
                  <Icon name="User" className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-orange-500/10 transition-colors shrink-0" onClick={onShowNotifications}>
                  <Icon name="Bell" className="w-5 h-5" />
                  {notificationsUnread > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[20px] text-center">
                      {notificationsUnread}
                    </span>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onLogout} 
                  className="text-white hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
                  title="Выйти"
                >
                  <Icon name="LogOut" size={18} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline"
                className="font-semibold px-3 sm:px-6 text-xs sm:text-sm"
              >
                ВХОД
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-primary hover:bg-primary/90 font-semibold px-3 sm:px-6 text-xs sm:text-sm"
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