import { toast } from '@/hooks/use-toast';

export const showSuccessToast = (description: string, title: string = 'Успешно') => {
  toast({
    title,
    description,
  });
};

export const showErrorToast = (description: string, title: string = 'Ошибка') => {
  toast({
    title,
    description,
    variant: 'destructive',
  });
};

export const showInfoToast = (description: string, title: string = 'Информация') => {
  toast({
    title,
    description,
  });
};
