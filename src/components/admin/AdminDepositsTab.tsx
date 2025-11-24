import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

const CRYPTO_URL = 'https://functions.poehali.dev/8caa3b76-72e5-42b5-9415-91d1f9b05210';

interface Deposit {
  id: number;
  user_id: number;
  amount: number;
  network: string;
  wallet_address: string;
  status: 'pending' | 'confirmed' | 'expired';
  tx_hash: string | null;
  created_at: string;
  confirmed_at: string | null;
  username?: string;
  email?: string;
}

interface AdminDepositsTabProps {
  deposits: Deposit[];
  currentUser: User;
  onRefresh: () => void;
}

const AdminDepositsTab = ({ deposits, currentUser, onRefresh }: AdminDepositsTabProps) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'expired'>('all');

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { text: 'Ожидает', variant: 'secondary' },
      confirmed: { text: 'Подтверждено', variant: 'outline' },
      expired: { text: 'Истекло', variant: 'destructive' }
    };
    const badge = badges[status] || badges.pending;
    return <Badge variant={badge.variant}>{badge.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDeposits = filterStatus === 'all' 
    ? deposits 
    : deposits.filter(d => d.status === filterStatus);

  const stats = {
    pending: deposits.filter(d => d.status === 'pending').length,
    confirmed: deposits.filter(d => d.status === 'confirmed').length,
    expired: deposits.filter(d => d.status === 'expired').length,
    total: deposits.reduce((sum, d) => d.status === 'confirmed' ? sum + Number(d.amount) : sum, 0)
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <Icon name="Clock" size={24} className="text-yellow-400" />
            <div>
              <p className="text-sm text-muted-foreground">Ожидают</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-3">
            <Icon name="CheckCircle" size={24} className="text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Подтверждено</p>
              <p className="text-2xl font-bold">{stats.confirmed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-3">
            <Icon name="XCircle" size={24} className="text-red-400" />
            <div>
              <p className="text-sm text-muted-foreground">Истекло</p>
              <p className="text-2xl font-bold">{stats.expired}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center gap-3">
            <Icon name="DollarSign" size={24} className="text-blue-400" />
            <div>
              <p className="text-sm text-muted-foreground">Всего зачислено</p>
              <p className="text-2xl font-bold">{stats.total.toFixed(2)} USDT</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Все
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            Ожидают
          </Button>
          <Button
            variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('confirmed')}
          >
            Подтверждено
          </Button>
          <Button
            variant={filterStatus === 'expired' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('expired')}
          >
            Истекло
          </Button>
        </div>

        {filteredDeposits.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Нет пополнений</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDeposits.map((deposit) => (
              <Card key={deposit.id} className="p-4 border-border/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-lg">{deposit.amount} USDT</span>
                      {getStatusBadge(deposit.status)}
                      <Badge variant="outline">{deposit.network}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div>
                        <p><strong>Пользователь:</strong> {deposit.username || deposit.email || `ID ${deposit.user_id}`}</p>
                        <p><strong>Кошелек:</strong> <span className="font-mono text-xs">{deposit.wallet_address}</span></p>
                      </div>
                      <div>
                        <p><strong>Создан:</strong> {formatDate(deposit.created_at)}</p>
                        {deposit.confirmed_at && (
                          <p><strong>Подтвержден:</strong> {formatDate(deposit.confirmed_at)}</p>
                        )}
                        {deposit.tx_hash && (
                          <p className="break-all"><strong>TX:</strong> <span className="font-mono text-xs">{deposit.tx_hash.substring(0, 20)}...</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDepositsTab;