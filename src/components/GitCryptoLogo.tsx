const GitCryptoLogo = () => {
  return (
    <>
      <div className="relative flex items-center justify-center">
        <div className="git-crypto-logo">
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            
            <g className="letters-group">
              <path 
                d="M 14 10 A 8 8 0 0 0 14 32 L 14 28 A 4 4 0 0 1 14 14 L 20 14" 
                stroke="url(#gcGradient)" 
                strokeWidth="3" 
                strokeLinecap="round"
                fill="none"
                className="letter-g"
              />
              
              <line 
                x1="20" 
                y1="21" 
                x2="14" 
                y2="21" 
                stroke="url(#gcGradient)" 
                strokeWidth="3" 
                strokeLinecap="round"
                className="letter-g-bar"
              />
              
              <path 
                d="M 28 10 A 8 8 0 0 0 28 32" 
                stroke="url(#gcGradient)" 
                strokeWidth="3" 
                strokeLinecap="round"
                fill="none"
                className="letter-c"
              />
              
              <circle 
                cx="17" 
                cy="10" 
                r="1.5" 
                fill="url(#gcGradient)" 
                className="dot dot-1"
              />
              <circle 
                cx="31" 
                cy="10" 
                r="1.5" 
                fill="url(#gcGradient)" 
                className="dot dot-2"
              />
              <circle 
                cx="17" 
                cy="32" 
                r="1.5" 
                fill="url(#gcGradient)" 
                className="dot dot-3"
              />
              <circle 
                cx="31" 
                cy="32" 
                r="1.5" 
                fill="url(#gcGradient)" 
                className="dot dot-4"
              />
            </g>
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.02);
          }
        }

        @keyframes letter-draw {
          0% {
            stroke-dashoffset: 100;
            opacity: 0.5;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes dot-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.3);
          }
        }

        .git-crypto-logo {
          animation: float 3s ease-in-out infinite;
        }

        .letters-group {
          transform-origin: center;
        }

        .letter-g, .letter-c, .letter-g-bar {
          stroke-dasharray: 100;
          stroke-dashoffset: 0;
          animation: letter-draw 2s ease-in-out infinite alternate;
        }

        .letter-c {
          animation-delay: 0.2s;
        }

        .letter-g-bar {
          animation-delay: 0.1s;
        }

        .dot {
          animation: dot-pulse 1.5s ease-in-out infinite;
        }

        .dot-1 {
          animation-delay: 0s;
        }

        .dot-2 {
          animation-delay: 0.2s;
        }

        .dot-3 {
          animation-delay: 0.4s;
        }

        .dot-4 {
          animation-delay: 0.6s;
        }

        .git-crypto-logo:hover {
          animation: float 1s ease-in-out infinite;
        }

        .git-crypto-logo:hover .letter-g,
        .git-crypto-logo:hover .letter-c,
        .git-crypto-logo:hover .letter-g-bar {
          animation: letter-draw 0.8s ease-in-out infinite alternate;
        }

        .git-crypto-logo:hover .dot {
          animation: dot-pulse 0.8s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default GitCryptoLogo;