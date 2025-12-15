import { User } from '@/types';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface AdminExchangeTabProps {
  users: User[];
  onManageToken: (userId: number, username: string, tokenSymbol: string, currentBalance: number) => void;
}

const AdminExchangeTab = ({ users, onManageToken }: AdminExchangeTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'usdt' | 'btc' | 'eth' | 'ton'>('username');

  // Токены для отображения
  const tokens = [
    { symbol: 'USDT', field: 'token_usdt' as keyof User, color: 'text-emerald-500', precision: 2 },
    { symbol: 'BTC', field: 'token_btc' as keyof User, color: 'text-orange-500', precision: 8 },
    { symbol: 'ETH', field: 'token_eth' as keyof User, color: 'text-blue-500', precision: 6 },
    { symbol: 'TRX', field: 'token_trx' as keyof User, color: 'text-red-500', precision: 2 },
    { symbol: 'TON', field: 'token_ton' as keyof User, color: 'text-cyan-500', precision: 2 },
    { symbol: 'SOL', field: 'token_sol' as keyof User, color: 'text-purple-500', precision: 4 },
  ];

  // Подсчет общих балансов
  const totalBalances = tokens.map(token => {
    const total = users.reduce((sum, user) => {
      const balance = Number(user[token.field]) || 0;
      return sum + balance;
    }, 0);
    return { ...token, total };
  });

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    return user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Сортировка пользователей
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'username') {
      return a.username.localeCompare(b.username);
    }
    const tokenField = `token_${sortBy}` as keyof User;
    const aBalance = Number(a[tokenField]) || 0;
    const bBalance = Number(b[tokenField]) || 0;
    return bBalance - aBalance; // По убыванию
  });

  // Показываем всех пользователей (токены могут быть 0 или undefined)
  const usersWithBalance = sortedUsers;
  
  // Подсчет пользователей с реальным балансом токенов
  const usersWithRealBalance = sortedUsers.filter(user => 
    tokens.some(token => Number(user[token.field]) > 0)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Обменник - Управление балансами</h2>
        <div className="text-sm text-muted-foreground">
          Всего пользователей: {usersWithBalance.length} | С балансом токенов: {usersWithRealBalance}
        </div>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {totalBalances.map(token => (
          <div key={token.symbol} className="bg-card/50 rounded-lg p-4 border border-border/50">
            <div className="text-xs text-muted-foreground mb-1">Всего {token.symbol}</div>
            <div className={`text-lg font-bold ${token.color}`}>
              {token.total.toFixed(token.precision)}
            </div>
          </div>
        ))}
      </div>

      {/* Поиск и сортировка */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Поиск по имени или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 rounded-md bg-background border border-border"
        >
          <option value="username">По имени</option>
          <option value="usdt">По USDT</option>
          <option value="btc">По BTC</option>
          <option value="eth">По ETH</option>
          <option value="ton">По TON</option>
        </select>
      </div>

      {/* Таблица пользователей */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-card/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Пользователь
                </th>
                {tokens.map(token => (
                  <th key={token.symbol} className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    {token.symbol}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {usersWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={tokens.length + 2} className="px-4 py-8 text-center text-muted-foreground">
                    {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
                  </td>
                </tr>
              ) : (
                usersWithBalance.map(user => (
                  <tr key={user.id} className="hover:bg-card/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Icon name="User" size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{user.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    {tokens.map(token => {
                      const balance = Number(user[token.field]) || 0;
                      return (
                        <td key={token.symbol} className="px-4 py-3 text-right">
                          <span className={`text-sm font-mono ${balance > 0 ? token.color : 'text-muted-foreground'}`}>
                            {balance > 0 ? balance.toFixed(token.precision) : '—'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {tokens.map(token => (
                          <Button
                            key={token.symbol}
                            size="sm"
                            variant="ghost"
                            onClick={() => onManageToken(user.id, user.username, token.symbol, Number(user[token.field]) || 0)}
                            className={`text-xs px-2 ${token.color} hover:bg-card`}
                            title={`Управление ${token.symbol}`}
                          >
                            {token.symbol}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Быстрая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Users" size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Пользователей с балансом</span>
          </div>
          <div className="text-2xl font-bold">{usersWithRealBalance}</div>
        </div>
        
        <div className="bg-card/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="TrendingUp" size={16} className="text-green-500" />
            <span className="text-sm text-muted-foreground">Самый популярный токен</span>
          </div>
          <div className="text-2xl font-bold">
            {totalBalances.reduce((max, token) => 
              token.total > max.total ? token : max
            ).symbol}
          </div>
        </div>
        
        <div className="bg-card/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="DollarSign" size={16} className="text-emerald-500" />
            <span className="text-sm text-muted-foreground">Общая ликвидность</span>
          </div>
          <div className="text-2xl font-bold">
            {totalBalances[0].total.toFixed(2)} USDT
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExchangeTab;