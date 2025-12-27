import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

const BONUSES = [10, 15, 20, 30, 35, 45, 55, 70, 100];

const ChristmasTree = () => {
  const navigate = useNavigate();
  const [hasPlayed, setHasPlayed] = useState(false);
  const [wonBonus, setWonBonus] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(0);

  useEffect(() => {
    const played = localStorage.getItem('christmas_tree_played');
    if (played) {
      setHasPlayed(true);
      const savedBonus = localStorage.getItem('christmas_tree_bonus');
      if (savedBonus) {
        setWonBonus(Number(savedBonus));
      }
    }
  }, []);

  const handleSpin = () => {
    if (hasPlayed) {
      toast.error('Вы уже получили свою скидку! Каждый пользователь может участвовать только один раз.', {
        duration: 4000,
      });
      return;
    }

    setIsSpinning(true);
    
    let counter = 0;
    const interval = setInterval(() => {
      setCurrentNumber(BONUSES[counter % BONUSES.length]);
      counter++;
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const randomBonus = BONUSES[Math.floor(Math.random() * BONUSES.length)];
      
      setCurrentNumber(randomBonus);
      setWonBonus(randomBonus);
      setHasPlayed(true);
      setIsSpinning(false);
      
      localStorage.setItem('christmas_tree_played', 'true');
      localStorage.setItem('christmas_tree_bonus', randomBonus.toString());
      
      toast.success(`🎉 Поздравляем! Вы выиграли скидку ${randomBonus}% на пополнение USDT!`, {
        duration: 5000,
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0118] via-[#1a0b2e] to-[#0a0118] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Button
          variant="ghost"
          className="mb-6 text-white hover:text-purple-300"
          onClick={() => navigate('/')}
        >
          <Icon name="ArrowLeft" className="mr-2" size={20} />
          На главную
        </Button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
            <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-red-400 to-green-400 bg-clip-text text-transparent">
              Новогодний Рандомайзер
            </h1>
            <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-lg sm:text-xl text-gray-300 mb-2">
            {hasPlayed ? '🎁 Вы уже получили свою скидку!' : '🎲 Испытайте удачу и получите скидку на пополнение!'}
          </p>
          <p className="text-sm text-gray-400">
            {hasPlayed ? `Ваша скидка ${wonBonus}% ждёт применения` : 'Скидка до 100% • Только одна попытка • Действует на первое пополнение USDT'}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {wonBonus && !isSpinning && (
            <div className="mb-8 p-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl text-center animate-bounce-in">
              <Gift className="w-20 h-20 mx-auto mb-4 text-yellow-400 animate-pulse" />
              <h3 className="text-3xl sm:text-4xl font-bold mb-3 flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-400" />
                Ваша скидка: {wonBonus}%
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </h3>
              <p className="text-gray-300 mb-6 text-lg">на первое пополнение USDT TRC20</p>
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-lg px-8 py-6"
              >
                <Zap className="mr-2" />
                Пополнить баланс
              </Button>
            </div>
          )}

          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 rounded-3xl blur-2xl"></div>
            
            <div className="relative bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-12 shadow-2xl">
              <div className="mb-8">
                <div className={`text-8xl sm:text-9xl font-black text-center bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent transition-all duration-200 ${isSpinning ? 'scale-110 blur-sm' : 'scale-100'}`}>
                  {isSpinning ? currentNumber : wonBonus || '?'}
                  <span className="text-5xl sm:text-6xl">%</span>
                </div>
                <p className="text-center text-gray-400 mt-4 text-lg">
                  {isSpinning ? 'Крутим барабан...' : hasPlayed ? 'Ваша скидка' : 'Нажмите кнопку'}
                </p>
              </div>

              <Button
                onClick={handleSpin}
                disabled={isSpinning || hasPlayed}
                className={`w-full py-8 text-2xl font-bold rounded-xl transition-all duration-300 ${
                  hasPlayed 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 shadow-lg hover:shadow-green-500/50 hover:scale-105'
                }`}
              >
                {isSpinning ? (
                  <span className="flex items-center justify-center gap-3">
                    <Icon name="Loader2" className="animate-spin" size={32} />
                    Определяем скидку...
                  </span>
                ) : hasPlayed ? (
                  '✓ Скидка получена'
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <Zap size={32} />
                    Испытать удачу
                    <Zap size={32} />
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {BONUSES.map((bonus, index) => (
              <div 
                key={bonus} 
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  wonBonus === bonus 
                    ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-yellow-500 scale-110 shadow-lg' 
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
                style={{
                  animation: isSpinning ? `pulse-item 0.5s ease-in-out infinite ${index * 0.1}s` : 'none'
                }}
              >
                <div className={`text-2xl sm:text-3xl font-bold ${wonBonus === bonus ? 'text-yellow-400' : 'text-white'}`}>
                  {bonus}%
                </div>
                <div className="text-xs text-gray-400">скидка</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Icon name="Info" size={20} className="text-blue-400" />
                Как это работает?
              </h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Нажмите кнопку "Испытать удачу" один раз</li>
                <li>• Рандомайзер определит вашу скидку от 10% до 100%</li>
                <li>• Скидка автоматически применится при первом пополнении USDT</li>
                <li>• Каждый пользователь может участвовать только один раз</li>
              </ul>
            </div>

            <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Icon name="Gift" size={20} className="text-green-400" />
                Новогодняя акция
              </h4>
              <p className="text-sm text-gray-300">
                Специальное новогоднее предложение действует ограниченное время! 
                Получите максимальную скидку и пополните баланс с выгодой до 100%! 🎄
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pulse-item {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};

export default ChristmasTree;
