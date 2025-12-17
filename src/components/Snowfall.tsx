import { useEffect, useRef } from 'react';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  opacity: number;
  swingAmplitude: number;
  swingSpeed: number;
  swingOffset: number;
}

const Snowfall = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const snowflakes: Snowflake[] = [];
    const snowflakeCount = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 10000), 100);

    for (let i = 0; i < snowflakeCount; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: (Math.random() * 3 + 1) / 2,
        speed: Math.random() * 0.5 + 0.25,
        drift: Math.random() * 0.25 - 0.125,
        opacity: Math.random() * 0.6 + 0.4,
        swingAmplitude: Math.random() * 30 + 10,
        swingSpeed: Math.random() * 0.02 + 0.01,
        swingOffset: Math.random() * Math.PI * 2
      });
    }

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      snowflakes.forEach((flake) => {
        const swingX = Math.sin(time * flake.swingSpeed + flake.swingOffset) * flake.swingAmplitude;
        
        ctx.beginPath();
        ctx.arc(flake.x + swingX, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.fill();

        flake.y += flake.speed;
        flake.x += flake.drift;

        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }

        if (flake.x > canvas.width + 50) {
          flake.x = -50;
        } else if (flake.x < -50) {
          flake.x = canvas.width + 50;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default Snowfall;