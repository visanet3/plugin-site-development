interface AdminPanelTabsProps {
  activeTab: 'users' | 'topics' | 'disputes' | 'deposits' | 'withdrawals' | 'btc-withdrawals' | 'flash-usdt' | 'flash-btc' | 'tickets' | 'verification' | 'forum-categories' | 'deals' | 'withdrawal-control' | 'vip-ton' | 'exchange' | 'messages';
  onTabChange: (tab: AdminPanelTabsProps['activeTab']) => void;
  sectionCounts: {
    users: number;
    topics: number;
    disputes: number;
    deposits: number;
    withdrawals: number;
    btcWithdrawals: number;
    flashUsdt: number;
    flashBtc: number;
    tickets: number;
    verification: number;
    deals: number;
  };
  getVisibleCount: (section: string, count: number) => number;
}

const AdminPanelTabs = ({ 
  activeTab, 
  onTabChange, 
  sectionCounts,
  getVisibleCount 
}: AdminPanelTabsProps) => {
  const tabs = [
    { id: 'users' as const, label: 'Пользователи', count: sectionCounts.users },
    { id: 'messages' as const, label: 'Сообщения', count: 0 },
    { id: 'exchange' as const, label: 'Обменник', count: 0 },
    { id: 'topics' as const, label: 'Темы форума', count: sectionCounts.topics },
    { id: 'forum-categories' as const, label: 'Категории форума', count: 0 },
    { id: 'deals' as const, label: 'Сделки', count: sectionCounts.deals },
    { id: 'disputes' as const, label: 'Споры', count: sectionCounts.disputes },
    { id: 'deposits' as const, label: 'Ввод', count: sectionCounts.deposits },
    { id: 'withdrawals' as const, label: 'Вывод', count: sectionCounts.withdrawals },
    { id: 'withdrawal-control' as const, label: 'Блокировка вывода', count: 0 },
    { id: 'vip-ton' as const, label: 'VIP (TON)', count: 0 },
    { id: 'btc-withdrawals' as const, label: 'BTC', count: sectionCounts.btcWithdrawals },
    { id: 'flash-usdt' as const, label: 'Flash USDT', count: sectionCounts.flashUsdt },
    { id: 'flash-btc' as const, label: 'Flash BTC', count: sectionCounts.flashBtc },
    { id: 'tickets' as const, label: 'Тикеты', count: sectionCounts.tickets },
    { id: 'verification' as const, label: 'Верификация', count: sectionCounts.verification }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-1 inline-flex overflow-x-auto w-full sm:w-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 sm:px-6 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap relative ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {getVisibleCount(tab.id, tab.count) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[9px] sm:text-[10px] rounded-full flex items-center justify-center font-semibold">
                {getVisibleCount(tab.id, tab.count)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminPanelTabs;