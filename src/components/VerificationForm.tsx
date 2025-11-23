import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

const VERIFICATION_URL = 'https://functions.poehali.dev/e0d94580-497a-452f-9044-0ef1b2ff42c8';

interface VerificationFormProps {
  user: User;
  onVerified: () => void;
}

interface VerificationStatus {
  is_verified: boolean;
  request: {
    id: number;
    status: string;
    admin_comment: string | null;
    created_at: string;
    reviewed_at: string | null;
  } | null;
}

const VerificationForm = ({ user, onVerified }: VerificationFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${VERIFICATION_URL}?action=status`, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Ошибка загрузки статуса:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleFileSelect = (type: 'passport' | 'selfie') => {
    if (type === 'passport') {
      passportInputRef.current?.click();
    } else {
      selfieInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'passport' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Выберите изображение',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 10 МБ',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'passport') {
        setPassportPhoto(base64);
      } else {
        setSelfiePhoto(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !birthDate || !passportPhoto) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(VERIFICATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'submit',
          full_name: fullName,
          birth_date: birthDate,
          passport_photo: passportPhoto,
          selfie_photo: selfiePhoto
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно!',
          description: 'Заявка на верификацию отправлена. Ожидайте проверки администратором.'
        });
        fetchStatus();
        setFullName('');
        setBirthDate('');
        setPassportPhoto(null);
        setSelfiePhoto(null);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка отправки заявки',
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
      setLoading(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (status?.is_verified) {
    return (
      <div className="border-2 border-primary/20 rounded-xl p-6 bg-primary/5">
        <div className="flex items-center gap-3 mb-2">
          <Icon name="CheckCircle" size={24} className="text-primary" />
          <h3 className="text-lg font-bold">Аккаунт верифицирован</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Ваш аккаунт успешно прошел верификацию
        </p>
      </div>
    );
  }

  if (status?.request?.status === 'pending') {
    return (
      <div className="border-2 border-orange-500/20 rounded-xl p-6 bg-orange-500/5">
        <div className="flex items-center gap-3 mb-2">
          <Icon name="Clock" size={24} className="text-orange-500" />
          <h3 className="text-lg font-bold">Заявка на проверке</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Ваша заявка отправлена {new Date(status.request.created_at).toLocaleDateString()}. 
          Ожидайте проверки администратором.
        </p>
      </div>
    );
  }

  if (status?.request?.status === 'rejected') {
    return (
      <div className="space-y-4">
        <div className="border-2 border-destructive/20 rounded-xl p-6 bg-destructive/5">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="XCircle" size={24} className="text-destructive" />
            <h3 className="text-lg font-bold">Заявка отклонена</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Ваша заявка была отклонена администратором.
          </p>
          {status.request.admin_comment && (
            <div className="mt-3 p-3 bg-background rounded-lg">
              <p className="text-sm"><strong>Причина:</strong> {status.request.admin_comment}</p>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setStatus({ ...status, request: null })}
        >
          Подать новую заявку
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-primary/20 rounded-xl p-4 bg-primary/5">
        <div className="flex items-start gap-3">
          <Icon name="ShieldCheck" size={24} className="text-primary mt-1" />
          <div>
            <h3 className="font-bold mb-1">Верификация аккаунта</h3>
            <p className="text-sm text-muted-foreground">
              Пройдите верификацию для повышения доверия и доступа к дополнительным возможностям
            </p>
          </div>
        </div>
      </div>

      <input
        ref={passportInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'passport')}
        className="hidden"
      />
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'selfie')}
        className="hidden"
      />

      <div>
        <label className="text-sm font-medium mb-1 block">ФИО <span className="text-destructive">*</span></label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Иванов Иван Иванович"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Дата рождения <span className="text-destructive">*</span></label>
        <Input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Фото паспорта <span className="text-destructive">*</span></label>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => handleFileSelect('passport')}
        >
          <Icon name="Upload" size={16} className="mr-2" />
          {passportPhoto ? 'Фото загружено ✓' : 'Загрузить фото паспорта'}
        </Button>
        {passportPhoto && (
          <img src={passportPhoto} alt="Passport" className="mt-2 max-h-40 rounded-lg" />
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Селфи с паспортом (опционально)</label>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => handleFileSelect('selfie')}
        >
          <Icon name="Camera" size={16} className="mr-2" />
          {selfiePhoto ? 'Селфи загружено ✓' : 'Загрузить селфи'}
        </Button>
        {selfiePhoto && (
          <img src={selfiePhoto} alt="Selfie" className="mt-2 max-h-40 rounded-lg" />
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Отправка...
          </>
        ) : (
          <>
            <Icon name="Send" size={16} className="mr-2" />
            Отправить на проверку
          </>
        )}
      </Button>
    </div>
  );
};

export default VerificationForm;
