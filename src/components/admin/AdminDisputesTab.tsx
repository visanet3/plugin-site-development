import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { EscrowDeal, User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const ESCROW_URL = 'https://functions.poehali.dev/82c75fbc-83e4-4448-9ff8-1c8ef9bbec09';

interface AdminDisputesTabProps {
  disputes: EscrowDeal[];
  currentUser: User;
  onUpdate: () => void;
}

const AdminDisputesTab = ({ disputes, currentUser, onUpdate }: AdminDisputesTabProps) => {
  const { toast } = useToast();
  const [selectedDeal, setSelectedDeal] = useState<EscrowDeal | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const openDealChat = async (deal: EscrowDeal) => {
    setSelectedDeal(deal);
    try {
      const response = await fetch(`${ESCROW_URL}?action=deal&id=${deal.id}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Ошибка загрузки чата:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDeal) return;

    try {
      await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'send_message',
          deal_id: selectedDeal.id,
          message: newMessage
        })
      });
      setNewMessage('');
      openDealChat(selectedDeal);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const resolveDispute = async (dealId: number, winnerId: number) => {
    if (!confirm('Разрешить спор в пользу этого пользователя?')) return;

    setLoading(true);
    try {
      const response = await fetch(ESCROW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'resolve_dispute',
          deal_id: dealId,
          winner_id: winnerId
        })
      });

      const data = await response.json();
      if (data.success) {
        const winner = winnerId === selectedDeal?.seller_id ? 'продавца' : 'покупателя';
        toast({
          title: 'Спор разрешен',
          description: `Спор разрешен в пользу ${winner}. Участники получат уведомления.`,
          duration: 5000
        });
        setSelectedDeal(null);
        onUpdate();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка разрешения спора',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {disputes.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <Icon name="CheckCircle2" size={40} className="mx-auto mb-4 text-green-400 sm:w-12 sm:h-12" />
          <p className="text-sm sm:text-base text-muted-foreground">Нет активных споров</p>
        </Card>
      ) : (
        disputes.map((deal) => (
          <Card key={deal.id} className="p-3 sm:p-4 border-orange-500/30">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-base sm:text-lg">{deal.title}</h3>
                  <Badge variant="destructive" className="text-xs">Спор</Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">{deal.description}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="Store" size={16} className="text-green-400" />
                    <span>Продавец: {deal.seller_name}</span>
                  </div>
                  {deal.buyer_name && (
                    <div className="flex items-center gap-2">
                      <Icon name="User" size={16} className="text-blue-400" />
                      <span>Покупатель: {deal.buyer_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon name="DollarSign" size={16} className="text-yellow-400" />
                    <span>{deal.price} USDT</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => openDealChat(deal)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 w-full sm:w-auto text-sm"
                size="sm"
              >
                <Icon name="MessageSquare" size={16} className="mr-2" />
                Открыть чат
              </Button>
            </div>
          </Card>
        ))
      )}

      {selectedDeal && (
        <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Спор: {selectedDeal.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="p-4 bg-orange-500/10 border-orange-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="AlertTriangle" size={24} className="text-orange-400" />
                  <div>
                    <h4 className="font-semibold text-orange-400">Информация о сделке</h4>
                    <p className="text-sm text-muted-foreground">{selectedDeal.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Продавец</p>
                    <p className="font-medium">{selectedDeal.seller_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Покупатель</p>
                    <p className="font-medium">{selectedDeal.buyer_name || 'Не указан'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Цена</p>
                    <p className="font-medium text-green-400">{selectedDeal.price} USDT</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Создана</p>
                    <p className="font-medium">{new Date(selectedDeal.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto bg-muted/30">
                <h4 className="font-semibold mb-3">История сообщений:</h4>
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.is_system
                          ? 'bg-blue-500/10 border border-blue-500/20 text-center text-sm'
                          : msg.user_role === 'admin'
                          ? 'bg-purple-500/10 border border-purple-500/30'
                          : 'bg-card border border-border'
                      }`}
                    >
                      {!msg.is_system && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${msg.user_role === 'admin' ? 'text-purple-400' : ''}`}>
                            {msg.user_role === 'admin' && '👑 '}
                            {msg.username}
                            {msg.user_role === 'admin' && ' (Администрация)'}
                          </span>
                        </div>
                      )}
                      <p className={msg.is_system ? 'text-blue-400 font-medium' : msg.user_role === 'admin' ? 'text-purple-300' : ''}>
                        {msg.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Сообщение от администрации..."
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} size="icon">
                  <Icon name="Send" size={18} />
                </Button>
              </div>

              <div className="border-t pt-3 sm:pt-4">
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Разрешить спор:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    onClick={() => resolveDispute(selectedDeal.id, selectedDeal.seller_id)}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-sm"
                    size="sm"
                  >
                    <Icon name="Check" size={16} className="mr-2" />
                    В пользу продавца
                  </Button>
                  {selectedDeal.buyer_id && (
                    <Button
                      onClick={() => resolveDispute(selectedDeal.id, selectedDeal.buyer_id)}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-sm"
                      size="sm"
                    >
                      <Icon name="Check" size={16} className="mr-2" />
                      В пользу покупателя
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminDisputesTab;