import { User, ForumTopic, EscrowDeal } from '@/types';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminTopicsTab from '@/components/admin/AdminTopicsTab';
import AdminDisputesTab from '@/components/admin/AdminDisputesTab';
import AdminWithdrawalsTab from '@/components/admin/AdminWithdrawalsTab';
import AdminDepositsTab from '@/components/admin/AdminDepositsTab';
import AdminEscrowTab from '@/components/admin/AdminEscrowTab';
import AdminTicketsTab from '@/components/admin/AdminTicketsTab';
import AdminVerificationTab from '@/components/admin/AdminVerificationTab';
import AdminBtcWithdrawalsTab from '@/components/admin/AdminBtcWithdrawalsTab';
import ForumCategoriesManager from '@/components/admin/ForumCategoriesManager';
import AdminForumModeration from '@/components/admin/AdminForumModeration';
import AdminFlashUsdtTab from '@/components/admin/AdminFlashUsdtTab';

interface AdminPanelContentProps {
  activeTab: 'users' | 'topics' | 'disputes' | 'deposits' | 'withdrawals' | 'btc-withdrawals' | 'escrow' | 'flash-usdt' | 'tickets' | 'verification' | 'forum-categories';
  users: User[];
  topics: ForumTopic[];
  disputes: EscrowDeal[];
  withdrawals: any[];
  deposits: any[];
  btcWithdrawals: any[];
  escrowDeals: EscrowDeal[];
  flashUsdtOrders: any[];
  tickets: any[];
  currentUser: User;
  onBlockUser: (userId: number, username: string) => void;
  onUnblockUser: (userId: number) => void;
  onDeleteUser: (userId: number, username: string) => void;
  onChangeForumRole: (userId: number, forumRole: string) => void;
  onEditTopic: (topic: ForumTopic) => void;
  onDeleteTopic: (topicId: number) => void;
  onUpdateViews: (topicId: number, views: number) => void;
  onRefreshWithdrawals: () => void;
  onRefreshDeposits: () => void;
  onRefreshBtcWithdrawals: () => void;
  onRefreshEscrow: () => void;
  onRefreshFlashUsdt: () => void;
  onRefreshTickets: () => void;
  onRefreshTopics: () => void;
}

const AdminPanelContent = ({
  activeTab,
  users,
  topics,
  disputes,
  withdrawals,
  deposits,
  btcWithdrawals,
  escrowDeals,
  flashUsdtOrders,
  tickets,
  currentUser,
  onBlockUser,
  onUnblockUser,
  onDeleteUser,
  onChangeForumRole,
  onEditTopic,
  onDeleteTopic,
  onUpdateViews,
  onRefreshWithdrawals,
  onRefreshDeposits,
  onRefreshBtcWithdrawals,
  onRefreshEscrow,
  onRefreshFlashUsdt,
  onRefreshTickets,
  onRefreshTopics
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

      {activeTab === 'escrow' && (
        <AdminEscrowTab 
          deals={escrowDeals}
          currentUser={currentUser}
          onRefresh={onRefreshEscrow}
        />
      )}

      {activeTab === 'flash-usdt' && (
        <AdminFlashUsdtTab 
          orders={flashUsdtOrders}
          currentUser={currentUser}
          onRefresh={onRefreshFlashUsdt}
        />
      )}

      {activeTab === 'tickets' && (
        <AdminTicketsTab 
          tickets={tickets}
          currentUser={currentUser}
          onRefresh={onRefreshTickets}
        />
      )}

      {activeTab === 'verification' && (
        <AdminVerificationTab 
          currentUser={currentUser}
        />
      )}

      {activeTab === 'forum-categories' && (
        <ForumCategoriesManager 
          userId={currentUser.id}
        />
      )}
    </div>
  );
};

export default AdminPanelContent;