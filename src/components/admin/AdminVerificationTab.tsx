import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarGradient } from '@/utils/avatarColors';
import { triggerNotificationUpdateImmediate } from '@/utils/notificationEvents';
import { triggerVerificationCheck } from '@/utils/verificationCache';

const VERIFICATION_URL = 'https://functions.poehali.dev/e0d94580-497a-452f-9044-0ef1b2ff42c8';

interface VerificationRequest {
  id: number;
  user_id: number;
  username: string;
  email: string;
  avatar_url?: string;
  full_name: string;
  birth_date: string;
  has_passport: boolean;
  has_selfie: boolean;
  passport_photo?: string;
  selfie_photo?: string;
  status: string;
  admin_comment?: string;
  created_at: string;
  reviewed_at?: string;
}

interface AdminVerificationTabProps {
  currentUser: User;
}

const AdminVerificationTab = ({ currentUser }: AdminVerificationTabProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      console.log('[Verification] Загрузка заявок с фильтром:', filter);
      console.log('[Verification] URL:', `${VERIFICATION_URL}?action=admin_list&status=${filter}`);
      console.log('[Verification] User ID:', currentUser.id);
      
      const response = await fetch(`${VERIFICATION_URL}?action=admin_list&status=${filter}`, {
        headers: {
          'X-User-Id': currentUser.id.toString()
        }
      });
      
      console.log('[Verification] Ответ сервера, статус:', response.status);
      console.log('[Verification] Response OK:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Verification] Текст ошибки:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Verification] Данные:', data);
      console.log('[Verification] Тип данных:', typeof data);
      console.log('[Verification] data.requests:', data.requests);
      
      setRequests(data.requests || []);
      console.log('[Verification] Установлено заявок:', data.requests?.length || 0);
    } catch (error) {
      console.error('[Verification] Ошибка загрузки:', error);
      console.error('[Verification] Стек ошибки:', error instanceof Error ? error.stack : 'нет стека');
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить заявки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (request: VerificationRequest) => {
    setSelectedRequest(request);
    setAdminComment('');
    setReviewDialogOpen(true);
    
    if (!request.passport_photo) {
      try {
        const response = await fetch(`${VERIFICATION_URL}?action=get_photos&request_id=${request.id}`, {
          headers: {
            'X-User-Id': currentUser.id.toString()
          }
        });
        
        if (response.ok) {
          const photos = await response.json();
          setSelectedRequest({
            ...request,
            passport_photo: photos.passport_photo,
            selfie_photo: photos.selfie_photo
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки фотографий:', error);
      }
    }
  };

  const handleSubmitReview = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const response = await fetch(VERIFICATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'review',
          request_id: selectedRequest.id,
          status,
          admin_comment: adminComment
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно',
          description: `Заявка ${status === 'approved' ? 'одобрена' : 'отклонена'}`
        });
        triggerNotificationUpdateImmediate(currentUser.id, currentUser.role);
        if (selectedRequest) {
          triggerVerificationCheck(selectedRequest.user_id);
        }
        setReviewDialogOpen(false);
        fetchRequests();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка обработки заявки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
        >
          Ожидают проверки
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
          size="sm"
        >
          Одобренные
        </Button>
        <Button
          variant={filter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setFilter('rejected')}
          size="sm"
        >
          Отклоненные
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="FileSearch" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Нет заявок</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={request.avatar_url} />
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(request.username)} text-white`}>
                    {request.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{request.username}</h3>
                    <span className="text-sm text-muted-foreground">({request.email})</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">ФИО:</span> {request.full_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Дата рождения:</span>{' '}
                      {new Date(request.birth_date).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Подана:</span>{' '}
                      {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>

                  {request.admin_comment && (
                    <div className="bg-accent rounded p-2 mb-3 text-sm">
                      <strong>Комментарий:</strong> {request.admin_comment}
                    </div>
                  )}

                  {filter === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleReview(request)}
                    >
                      <Icon name="Eye" size={16} className="mr-2" />
                      Проверить
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Проверка заявки на верификацию</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-accent rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Пользователь</p>
                  <p className="font-bold">{selectedRequest.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-bold">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ФИО</p>
                  <p className="font-bold">{selectedRequest.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Дата рождения</p>
                  <p className="font-bold">{new Date(selectedRequest.birth_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Фото паспорта</h3>
                <img
                  src={selectedRequest.passport_photo}
                  alt="Passport"
                  className="max-w-full rounded-lg border"
                />
              </div>

              {selectedRequest.selfie_photo && (
                <div>
                  <h3 className="font-bold mb-2">Селфи с паспортом</h3>
                  <img
                    src={selectedRequest.selfie_photo}
                    alt="Selfie"
                    className="max-w-full rounded-lg border"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">Комментарий (опционально)</label>
                <Textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Укажите причину отклонения или комментарий..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleSubmitReview('approved')}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Icon name="CheckCircle" size={16} className="mr-2" />
                  Одобрить
                </Button>
                <Button
                  onClick={() => handleSubmitReview('rejected')}
                  disabled={submitting}
                  variant="destructive"
                  className="flex-1"
                >
                  <Icon name="XCircle" size={16} className="mr-2" />
                  Отклонить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerificationTab;