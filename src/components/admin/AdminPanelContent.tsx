import { User, ForumTopic, EscrowDeal } from '@/types';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminTopicsTab from '@/components/admin/AdminTopicsTab';
import AdminDisputesTab from '@/components/admin/AdminDisputesTab';
import AdminWithdrawalsTab from '@/components/admin/AdminWithdrawalsTab';
import AdminDepositsTab from '@/components/admin/AdminDepositsTab';
import AdminTicketsTab from '@/components/admin/AdminTicketsTab';
import AdminVerificationTab from '@/components/admin/AdminVerificationTab';
import AdminBtcWithdrawalsTab from '@/components/admin/AdminBtcWithdrawalsTab';
import ForumCategoriesManager from '@/components/admin/ForumCategoriesManager';
import AdminForumModeration from '@/components/admin/AdminForumModeration';
import AdminFlashUsdtTab from '@/components/admin/AdminFlashUsdtTab';
import AdminFlashBtcTab from '@/components/admin/AdminFlashBtcTab';
import AdminDealsSection from '@/components/admin/AdminDealsSection';
import AdminWithdrawalControl from '@/components/AdminWithdrawalControl';
import AdminVipTonTab from '@/components/admin/AdminVipTonTab';
import AdminExchangeTab from '@/components/admin/AdminExchangeTab';
import AdminMessagesTab from '@/components/admin/AdminMessagesTab';

interface AdminPanelContentProps {
  activeTab: 'users' | 'topics' | 'disputes' | 'deposits' | 'withdrawals' | 'btc-withdrawals' | 'flash-usdt' | 'flash-btc' | 'tickets' | 'verification' | 'forum-categories' | 'deals' | 'withdrawal-control' | 'vip-ton' | 'exchange' | 'messages';
  deals: any[];
  users: User[];
  topics: ForumTopic[];
  disputes: EscrowDeal[];
  withdrawals: any[];
  deposits: any[];
  btcWithdrawals: any[];
  flashUsdtOrders: any[];
  tickets: any[];
  currentUser: User;
  onBlockUser: (userId: number, username: string) => void;
  onUnblockUser: (userId: number) => void;
  onDeleteUser: (userId: number, username: string) => void;
  onChangeForumRole: (userId: number, forumRole: string) => void;
  onManageBtc: (userId: number, username: string, currentBalance: number) => void;
  onVerifyUser: (userId: number, username: string) => void;
  onManageToken: (userId: number, username: string, tokenSymbol: string, currentBalance: number) => void;
  onEditTopic: (topic: ForumTopic) => void;
  onDeleteTopic: (topicId: number) => void;
  onUpdateViews: (topicId: number, views: number) => void;
  onRefreshWithdrawals: () => void;
  onRefreshDeposits: () => void;
  onRefreshBtcWithdrawals: () => void;
  onRefreshFlashUsdt: () => void;
  onRefreshTickets: () => void;
  onRefreshTopics: () => void;
  onUpdateTicketStatus: (ticketId: number, status: 'open' | 'answered' | 'closed') => void;
  onRefreshDeals: () => void;
  onDownloadExchangeData?: () => void;
  onViewUserExpenses?: (userId: number, username: string) => void;
}

const AdminPanelContent = ({
  activeTab,
  users,
  topics,
  disputes,
  withdrawals,
  deposits,
  btcWithdrawals,
  flashUsdtOrders,
  tickets,
  deals,
  currentUser,
  onBlockUser,
  onUnblockUser,
  onDeleteUser,
  onChangeForumRole,
  onManageBtc,
  onVerifyUser,
  onManageToken,
  onEditTopic,
  onDeleteTopic,
  onUpdateViews,
  onRefreshWithdrawals,
  onRefreshDeposits,
  onRefreshBtcWithdrawals,
  onRefreshFlashUsdt,
  onRefreshTickets,
  onRefreshTopics,
  onUpdateTicketStatus,
  onRefreshDeals,
  onDownloadExchangeData,
  onViewUserExpenses
}: AdminPanelContentProps) => {
  return (
    <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-3 sm:p-6 animate-fade-in">
      {activeTab === 'users' && (
        <AdminUsersTab 
          users={users}
          currentUser={currentUser}
          onBlockUser={onBlockUser}
          onUnblockUser={onUnblockUser}
          onDeleteUser={onDeleteUser}
          onChangeForumRole={onChangeForumRole}
          onManageBtc={onManageBtc}
          onVerifyUser={onVerifyUser}
          onManageToken={onManageToken}
        />
      )}

      {activeTab === 'topics' && (
        <AdminForumModeration 
          topics={topics}
          onRefresh={onRefreshTopics}
          currentUserId={currentUser.id}
        />
      )}

      {activeTab === 'disputes' && (
        <AdminDisputesTab 
          disputes={disputes}
          currentUser={currentUser}
        />
      )}

      {activeTab === 'withdrawals' && (
        <AdminWithdrawalsTab 
          withdrawals={withdrawals}
          currentUser={currentUser}
          onRefresh={onRefreshWithdrawals}
        />
      )}

      {activeTab === 'deposits' && (
        <AdminDepositsTab 
          deposits={deposits}
          currentUser={currentUser}
          onRefresh={onRefreshDeposits}
        />
      )}

      {activeTab === 'btc-withdrawals' && (
        <AdminBtcWithdrawalsTab 
          withdrawals={btcWithdrawals}
          currentUser={currentUser}
          onRefresh={onRefreshBtcWithdrawals}
        />
      )}

      {activeTab === 'flash-usdt' && (
        <AdminFlashUsdtTab 
          orders={flashUsdtOrders}
          currentUser={currentUser}
          onRefresh={onRefreshFlashUsdt}
        />
      )}

      {activeTab === 'flash-btc' && (
        <AdminFlashBtcTab />
      )}

      {activeTab === 'tickets' && (
        <AdminTicketsTab 
          tickets={tickets}
          currentUser={currentUser}
          onRefresh={onRefreshTickets}
          onUpdateTicketStatus={onUpdateTicketStatus}
        />
      )}

      {activeTab === 'verification' && (
        <AdminVerificationTab 
          currentUser={currentUser}
        />
      )}

      {activeTab === 'deals' && (
        <AdminDealsSection
          deals={deals}
          currentUserId={currentUser.id}
          onRefresh={onRefreshDeals}
        />
      )}

      {activeTab === 'forum-categories' && (
        <ForumCategoriesManager 
          userId={currentUser.id}
        />
      )}

      {activeTab === 'withdrawal-control' && (
        <AdminWithdrawalControl 
          user={currentUser}
        />
      )}

      {activeTab === 'vip-ton' && (
        <AdminVipTonTab 
          currentUser={currentUser}
          onRefresh={() => {}}
        />
      )}

      {activeTab === 'exchange' && (
        <AdminExchangeTab 
          users={users}
          onManageToken={onManageToken}
          onDownloadExchangeData={onDownloadExchangeData}
          onViewUserExpenses={onViewUserExpenses}
        />
      )}

      {activeTab === 'messages' && (
        <AdminMessagesTab 
          currentUser={currentUser}
          onRefresh={() => {}}
        />
      )}
    </div>
  );
};

export default AdminPanelContent;