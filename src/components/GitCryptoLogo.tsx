const GitCryptoLogo = () => {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <div className="absolute inset-0 animate-pulse">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-green-500 via-teal-500 to-cyan-600 opacity-30 blur-sm"></div>
      </div>
      
      <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-green-500 via-teal-500 to-cyan-600 flex items-center justify-center overflow-hidden group shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-teal-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="git-crypto-fragments">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="git-crypto-icon">
              {/* Hexagon shape like Tether */}
              <path 
                d="M12 2L21 7V17L12 22L3 17V7L12 2Z" 
                fill="white" 
                fillOpacity="0.95" 
                className="fragment-hex"
              />
              
              {/* Git branch symbol + crypto elements */}
              {/* Gradient definition */}
              <defs>
                <linearGradient id="gitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              
              <g className="fragment-symbol">
                {/* Main vertical line */}
                <path 
                  d="M12 7V17" 
                  stroke="url(#gitGradient)" 
                  strokeWidth="1.8" 
                  strokeLinecap="round"
                />
                {/* Branch circles */}
                <circle cx="12" cy="8" r="1.8" fill="url(#gitGradient)" className="pulse-circle"/>
                <circle cx="12" cy="16" r="1.8" fill="url(#gitGradient)" className="pulse-circle"/>
                {/* Side branch */}
                <path 
                  d="M12 12L15 12" 
                  stroke="url(#gitGradient)" 
                  strokeWidth="1.8" 
                  strokeLinecap="round"
                />
                <circle cx="15" cy="12" r="1.5" fill="url(#gitGradient)" className="pulse-circle"/>
                {/* Dollar sign overlay */}
                <text 
                  x="8" 
                  y="13.5" 
                  fontSize="7" 
                  fill="url(#gitGradient)" 
                  fontWeight="bold"
                  className="dollar-sign"
                >
                  $
                </text>
              </g>
            </svg>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-50"></div>
      </div>

      <style>{`
        @keyframes glitch-git {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          10% {
            transform: translate(-1px, -0.5px) scale(1.01);
            opacity: 0.95;
          }
          20% {
            transform: translate(1px, 0.5px) scale(0.99);
            opacity: 1;
          }
          30% {
            transform: translate(-0.5px, 1px) scale(1.005);
            opacity: 0.97;
          }
          40% {
            transform: translate(0.5px, -1px) scale(0.995);
            opacity: 1;
          }
          50% {
            transform: translate(-1px, 0.5px) scale(1.01) rotate(0.5deg);
            opacity: 0.95;
          }
          60% {
            transform: translate(1px, -0.5px) scale(0.99) rotate(-0.5deg);
            opacity: 1;
          }
        }

        @keyframes fragment-hex-break {
          0%, 90%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          92% {
            transform: translate(-0.5px, -0.5px) rotate(-1deg);
            opacity: 0.85;
          }
          94% {
            transform: translate(0.5px, 0.5px) rotate(1deg);
            opacity: 0.9;
          }
          96% {
            transform: translate(-0.25px, 0.25px) rotate(-0.5deg);
            opacity: 0.95;
          }
        }

        @keyframes fragment-symbol-break {
          0%, 90%, 100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          92% {
            transform: translate(0.5px, -0.5px) rotate(2deg) scale(1.03);
            opacity: 0.8;
          }
          94% {
            transform: translate(-0.5px, 0.5px) rotate(-2deg) scale(0.97);
            opacity: 0.88;
          }
          96% {
            transform: translate(0.25px, -0.25px) rotate(0.5deg) scale(1.01);
            opacity: 0.92;
          }
        }

        @keyframes pulse-circle-anim {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }

        .git-crypto-icon {
          animation: glitch-git 5s ease-in-out infinite;
          transform-origin: center;
        }

        .fragment-hex {
          animation: fragment-hex-break 5s ease-in-out infinite;
          transform-origin: center;
        }

        .fragment-symbol {
          animation: fragment-symbol-break 5s ease-in-out infinite;
          transform-origin: center;
        }

        .pulse-circle {
          animation: pulse-circle-anim 2s ease-in-out infinite;
        }

        .dollar-sign {
          animation: pulse-circle-anim 2s ease-in-out infinite;
        }

        .git-crypto-fragments:hover .git-crypto-icon {
          animation: glitch-git 1s ease-in-out infinite;
        }

        .git-crypto-fragments:hover .fragment-hex {
          animation: fragment-hex-break 1s ease-in-out infinite;
        }

        .git-crypto-fragments:hover .fragment-symbol {
          animation: fragment-symbol-break 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default GitCryptoLogo;