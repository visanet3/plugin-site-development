/**
 * Компонент мониторинга DDoS защиты (только для админов)
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { ddosProtection } from '@/utils/ddos-protection';

interface DDoSMonitorProps {
  currentUser: User;
}

const DDoSMonitor = ({ currentUser }: DDoSMonitorProps) => {
  const [stats, setStats] = useState({ total: 0, blocked: 0, active: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Только для админов
    if (currentUser.role !== 'admin') return;

    const updateStats = () => {
      const newStats = ddosProtection.getStats();
      setStats(newStats);
    };

    updateStats();
  }, [currentUser.role]);

  // Показывать только админам
  if (currentUser.role !== 'admin') return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!visible ? (
        <button
          onClick={() => setVisible(true)}
          className="p-3 bg-card border border-border rounded-full shadow-lg hover:scale-110 transition-transform"
          title="DDoS Protection Monitor"
        >
          <Icon name="Shield" size={20} className="text-primary" />
        </button>
      ) : (
        <Card className="p-4 bg-card/95 backdrop-blur-sm border-border shadow-xl min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="Shield" size={18} className="text-primary" />
              <h3 className="font-semibold text-sm">DDoS Protection</h3>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Всего клиентов:</span>
              <span className="font-semibold">{stats.total}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Активных:</span>
              <span className="font-semibold text-green-400">{stats.active}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Заблокировано:</span>
              <span className="font-semibold text-red-400">{stats.blocked}</span>
            </div>

            <div className="pt-2 mt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${stats.blocked > 0 ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse`}></div>
                <span>
                  {stats.blocked > 0 
                    ? 'Обнаружена подозрительная активность' 
                    : 'Нормальная работа'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            <p>Лимит: 100 запросов/мин</p>
            <p>Блокировка: 5 минут</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DDoSMonitor;