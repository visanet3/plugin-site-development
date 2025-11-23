import { useState, useEffect } from 'react';
import { LotteryRound } from './LotteryDataLoader';

export const useLotteryTimer = (currentRound: LotteryRound | null) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (currentRound?.draw_time) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const drawTime = new Date(currentRound.draw_time!).getTime();
        const diff = drawTime - now;

        if (diff <= 0) {
          setTimeLeft('Идет розыгрыш...');
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeLeft('');
    }
  }, [currentRound]);

  return timeLeft;
};
