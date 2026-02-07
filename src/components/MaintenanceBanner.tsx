import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

export const MaintenanceBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center animate-pulse">
              <Icon name="AlertTriangle" size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Wrench" size={16} className="text-white sm:hidden" />
                <h3 className="font-bold text-sm sm:text-base">Технические работы</h3>
              </div>
              <p className="text-xs sm:text-sm text-white/90">
                На сайте проводятся технические работы в связи с добавлением новой партии Flash USDT. 
                Некоторые функции могут быть временно недоступны.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="shrink-0 hover:bg-white/20 text-white"
          >
            <Icon name="X" size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
