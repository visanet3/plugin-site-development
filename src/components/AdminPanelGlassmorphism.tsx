import { useState, useEffect } from 'react';
import { Home, Users, MessageSquare, AlertCircle, DollarSign, Bitcoin, Zap, Ticket, CheckCircle, Briefcase, Shield, Settings, X } from 'lucide-react';
import { User, ForumTopic } from '@/types';
import AdminPanelContent from '@/components/admin/AdminPanelContent';
import AdminBalanceDialog from '@/components/admin/AdminBalanceDialog';
import AdminBtcBalanceDialog from '@/components/admin/AdminBtcBalanceDialog';
import AdminTokenBalanceDialog from '@/components/admin/AdminTokenBalanceDialog';
import AdminTopicEditDialog from '@/components/admin/AdminTopicEditDialog';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelGlassmorphismProps {
  currentUser: User;
  onClose: () => void;
}

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';
const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';
const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const WITHDRAWAL_URL = 'https://functions.poehali.dev/09f16983-ec42-41fe-a7bd-695752ee11c5';
const CRYPTO_URL = 'https://functions.poehali.dev/8caa3b76-72e5-42b5-9415-91d1f9b05210';
const FLASH_USDT_URL = 'https://functions.poehali.dev/9d93686d-9a6f-47bc-85a8-7b7c28e4edd7';
const TICKETS_URL = 'https://functions.poehali.dev/f2a5cbce-6afc-4ef1-91a6-f14075db8567';
const DEALS_URL = 'https://functions.poehali.dev/8a665174-b0af-4138-82e0-a9422dbb8fc4';

type TabType = 'users' | 'topics' | 'disputes' | 'deposits' | 'withdrawals' | 'btc-withdrawals' | 'flash-usdt' | 'flash-btc' | 'tickets' | 'verification' | 'forum-categories' | 'deals' | 'withdrawal-control' | 'vip-ton' | 'exchange' | 'messages';

const navItems = [
  { page: 'users', label: 'Пользователи', icon: <Users className="w-5 h-5" /> },
  { page: 'topics', label: 'Темы форума', icon: <MessageSquare className="w-5 h-5" /> },
  { page: 'disputes', label: 'Споры', icon: <AlertCircle className="w-5 h-5" /> },
  { page: 'deposits', label: 'Пополнения', icon: <DollarSign className="w-5 h-5" /> },
  { page: 'withdrawals', label: 'Выводы', icon: <DollarSign className="w-5 h-5" /> },
  { page: 'btc-withdrawals', label: 'Выводы BTC', icon: <Bitcoin className="w-5 h-5" /> },
  { page: 'flash-usdt', label: 'Flash USDT', icon: <Zap className="w-5 h-5" /> },
  { page: 'tickets', label: 'Тикеты', icon: <Ticket className="w-5 h-5" /> },
  { page: 'verification', label: 'Верификация', icon: <CheckCircle className="w-5 h-5" /> },
  { page: 'deals', label: 'Сделки', icon: <Briefcase className="w-5 h-5" /> },
];

const Sidebar = ({ 
  activePage, 
  setActivePage, 
  currentUser,
  onClose,
  sectionCounts 
}: { 
  activePage: TabType; 
  setActivePage: (page: TabType) => void;
  currentUser: User;
  onClose: () => void;
  sectionCounts: Record<string, number>;
}) => (
  <aside className="glass-effect w-64 flex-shrink-0 flex flex-col z-10 relative">
    <button 
      onClick={onClose}
      className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
    >
      <X className="w-5 h-5" />
    </button>
    
    <div className="h-20 flex items-center justify-center border-b border-white/10">
      <div className="flex items-center gap-2">
        <Shield className="w-8 h-8 text-indigo-400" />
        <span className="text-xl font-bold text-white">Admin Panel</span>
      </div>
    </div>
    
    <nav className="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar">
      {navItems.map(item => {
        const count = sectionCounts[item.page] || 0;
        return (
          <a
            key={item.page}
            href="#"
            className={`nav-link flex items-center justify-between gap-3 px-4 py-2 rounded-lg text-gray-300 transition-colors hover:bg-white/5 ${activePage === item.page ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActivePage(item.page as TabType);
            }}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </div>
            {count > 0 && (
              <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </a>
        );
      })}
    </nav>
    
    <div className="p-4 border-t border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center text-white font-bold">
          {currentUser.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{currentUser.username}</p>
          <p className="text-xs text-gray-400">Администратор</p>
        </div>
      </div>
    </div>
  </aside>
);

const AdminPanelGlassmorphism = ({ currentUser, onClose }: AdminPanelGlassmorphismProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [btcWithdrawals, setBtcWithdrawals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [deals, setDeals] = useState<any[]>([]);
  const [flashUsdtOrders, setFlashUsdtOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [editingTopic, setEditingTopic] = useState<ForumTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceAction, setBalanceAction] = useState<'add' | 'subtract'>('add');
  const [balanceUsername, setBalanceUsername] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showBtcBalanceDialog, setShowBtcBalanceDialog] = useState(false);
  const [btcBalanceUserId, setBtcBalanceUserId] = useState<number>(0);
  const [btcBalanceUsername, setBtcBalanceUsername] = useState('');
  const [btcBalanceAmount, setBtcBalanceAmount] = useState(0);
  const [btcBalanceLoading, setBtcBalanceLoading] = useState(false);
  const [showTokenBalanceDialog, setShowTokenBalanceDialog] = useState(false);
  const [tokenBalanceUserId, setTokenBalanceUserId] = useState<number>(0);
  const [tokenBalanceUsername, setTokenBalanceUsername] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenCurrentBalance, setTokenCurrentBalance] = useState(0);
  
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({
    users: 0,
    topics: 0,
    disputes: 0,
    deposits: 0,
    withdrawals: 0,
    btcWithdrawals: 0,
    flashUsdt: 0,
    flashBtc: 0,
    tickets: 0,
    verification: 0,
    deals: 0
  });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'topics') {
      fetchTopics();
    } else if (activeTab === 'disputes') {
      fetchDisputes();
    } else if (activeTab === 'withdrawals') {
      fetchWithdrawals();
    } else if (activeTab === 'deposits') {
      fetchDeposits();
    } else if (activeTab === 'flash-usdt') {
      fetchFlashUsdtOrders();
    } else if (activeTab === 'tickets') {
      fetchTickets();
    } else if (activeTab === 'btc-withdrawals') {
      fetchBtcWithdrawals();
    } else if (activeTab === 'deals') {
      fetchDeals();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${ADMIN_URL}?action=get_users`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        updateSectionCount('users', data.users.length);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch(`${FORUM_URL}?action=get_topics`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setTopics(data.topics);
        updateSectionCount('topics', data.topics.length);
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

  const fetchDisputes = async () => {
    try {
      const response = await fetch(`${ADMIN_URL}?action=get_disputes`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setDisputes(data.disputes);
        updateSectionCount('disputes', data.disputes.length);
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch(`${WITHDRAWAL_URL}?action=admin_get_pending`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
        updateSectionCount('withdrawals', data.withdrawals.length);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    }
  };

  const fetchDeposits = async () => {
    try {
      const response = await fetch(`${ADMIN_URL}?action=get_deposits`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setDeposits(data.deposits);
        updateSectionCount('deposits', data.deposits.length);
      }
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
    }
  };

  const fetchBtcWithdrawals = async () => {
    try {
      const response = await fetch(`${CRYPTO_URL}?action=admin_get_withdrawals`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setBtcWithdrawals(data.withdrawals);
        updateSectionCount('btcWithdrawals', data.withdrawals.length);
      }
    } catch (error) {
      console.error('Failed to fetch BTC withdrawals:', error);
    }
  };

  const fetchFlashUsdtOrders = async () => {
    try {
      const response = await fetch(`${FLASH_USDT_URL}?action=admin_get_orders`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setFlashUsdtOrders(data.orders);
        updateSectionCount('flashUsdt', data.orders.length);
      }
    } catch (error) {
      console.error('Failed to fetch flash USDT orders:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${TICKETS_URL}?action=admin_get_tickets`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets);
        updateSectionCount('tickets', data.tickets.length);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${DEALS_URL}?action=admin_get_deals`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setDeals(data.deals);
        updateSectionCount('deals', data.deals.length);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    }
  };

  const updateSectionCount = (section: string, count: number) => {
    setSectionCounts(prev => ({ ...prev, [section]: count }));
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-900 text-gray-200">
      <div className="shape-1"></div>
      <div className="shape-2"></div>
      
      <Sidebar 
        activePage={activeTab} 
        setActivePage={setActiveTab}
        currentUser={currentUser}
        onClose={onClose}
        sectionCounts={sectionCounts}
      />
      
      <main className="flex-grow p-6 overflow-y-auto custom-scrollbar relative z-10">
        <div className="content-card">
          <AdminPanelContent
            activeTab={activeTab}
            users={users}
            topics={topics}
            disputes={disputes}
            withdrawals={withdrawals}
            deposits={deposits}
            btcWithdrawals={btcWithdrawals}
            flashUsdtOrders={flashUsdtOrders}
            tickets={tickets}
            deals={deals}
            onRefresh={() => {
              if (activeTab === 'users') fetchUsers();
              else if (activeTab === 'topics') fetchTopics();
              else if (activeTab === 'disputes') fetchDisputes();
              else if (activeTab === 'withdrawals') fetchWithdrawals();
              else if (activeTab === 'deposits') fetchDeposits();
              else if (activeTab === 'btc-withdrawals') fetchBtcWithdrawals();
              else if (activeTab === 'flash-usdt') fetchFlashUsdtOrders();
              else if (activeTab === 'tickets') fetchTickets();
              else if (activeTab === 'deals') fetchDeals();
            }}
            onEditTopic={(topic) => {
              setEditingTopic(topic);
              setEditTitle(topic.title);
              setEditContent(topic.content);
            }}
            onShowBalanceDialog={(action, username) => {
              setBalanceAction(action);
              setBalanceUsername(username);
              setShowBalanceDialog(true);
            }}
            onShowBtcBalanceDialog={(userId, username) => {
              setBtcBalanceUserId(userId);
              setBtcBalanceUsername(username);
              setShowBtcBalanceDialog(true);
            }}
            onShowTokenBalanceDialog={(userId, username, symbol, currentBalance) => {
              setTokenBalanceUserId(userId);
              setTokenBalanceUsername(username);
              setTokenSymbol(symbol);
              setTokenCurrentBalance(currentBalance);
              setShowTokenBalanceDialog(true);
            }}
          />
        </div>
      </main>

      {showBalanceDialog && (
        <AdminBalanceDialog
          action={balanceAction}
          username={balanceUsername}
          amount={balanceAmount}
          loading={balanceLoading}
          onAmountChange={setBalanceAmount}
          onClose={() => {
            setShowBalanceDialog(false);
            setBalanceAmount('');
          }}
          onSubmit={async () => {
            setBalanceLoading(true);
            try {
              const response = await fetch(`${ADMIN_URL}?action=${balanceAction}_balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  username: balanceUsername,
                  amount: parseFloat(balanceAmount),
                }),
              });
              const data = await response.json();
              if (data.success) {
                toast({ title: 'Успех', description: 'Баланс обновлен' });
                setShowBalanceDialog(false);
                setBalanceAmount('');
                fetchUsers();
              } else {
                toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Ошибка', description: 'Не удалось обновить баланс', variant: 'destructive' });
            } finally {
              setBalanceLoading(false);
            }
          }}
        />
      )}

      {showBtcBalanceDialog && (
        <AdminBtcBalanceDialog
          username={btcBalanceUsername}
          amount={btcBalanceAmount}
          loading={btcBalanceLoading}
          onAmountChange={setBtcBalanceAmount}
          onClose={() => {
            setShowBtcBalanceDialog(false);
            setBtcBalanceAmount(0);
          }}
          onSubmit={async () => {
            setBtcBalanceLoading(true);
            try {
              const response = await fetch(`${CRYPTO_URL}?action=admin_update_balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  user_id: btcBalanceUserId,
                  amount: btcBalanceAmount,
                }),
              });
              const data = await response.json();
              if (data.success) {
                toast({ title: 'Успех', description: 'BTC баланс обновлен' });
                setShowBtcBalanceDialog(false);
                setBtcBalanceAmount(0);
                fetchUsers();
              } else {
                toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Ошибка', description: 'Не удалось обновить BTC баланс', variant: 'destructive' });
            } finally {
              setBtcBalanceLoading(false);
            }
          }}
        />
      )}

      {showTokenBalanceDialog && (
        <AdminTokenBalanceDialog
          username={tokenBalanceUsername}
          symbol={tokenSymbol}
          currentBalance={tokenCurrentBalance}
          onClose={() => setShowTokenBalanceDialog(false)}
          onSubmit={async (newBalance) => {
            try {
              const response = await fetch(`${CRYPTO_URL}?action=admin_update_token_balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  user_id: tokenBalanceUserId,
                  symbol: tokenSymbol,
                  balance: newBalance,
                }),
              });
              const data = await response.json();
              if (data.success) {
                toast({ title: 'Успех', description: `Баланс ${tokenSymbol} обновлен` });
                setShowTokenBalanceDialog(false);
                fetchUsers();
              } else {
                toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Ошибка', description: `Не удалось обновить баланс ${tokenSymbol}`, variant: 'destructive' });
            }
          }}
        />
      )}

      {editingTopic && (
        <AdminTopicEditDialog
          topic={editingTopic}
          title={editTitle}
          content={editContent}
          onTitleChange={setEditTitle}
          onContentChange={setEditContent}
          onClose={() => {
            setEditingTopic(null);
            setEditTitle('');
            setEditContent('');
          }}
          onSubmit={async () => {
            try {
              const response = await fetch(`${FORUM_URL}?action=update_topic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  topic_id: editingTopic.id,
                  title: editTitle,
                  content: editContent,
                }),
              });
              const data = await response.json();
              if (data.success) {
                toast({ title: 'Успех', description: 'Тема обновлена' });
                setEditingTopic(null);
                setEditTitle('');
                setEditContent('');
                fetchTopics();
              } else {
                toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Ошибка', description: 'Не удалось обновить тему', variant: 'destructive' });
            }
          }}
        />
      )}
    </div>
  );
};

export default AdminPanelGlassmorphism;
