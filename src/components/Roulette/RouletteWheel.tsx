interface RouletteWheelProps {
  rotation: number;
  gameState: 'betting' | 'spinning' | 'finished';
  winningNumber: number | null;
  getNumberColor: (num: number) => 'red' | 'black' | 'green';
}

const RouletteWheel = ({ rotation, gameState, winningNumber, getNumberColor }: RouletteWheelProps) => {
  return (
    <div className="flex justify-center py-4">
      <div className="relative w-48 h-48">
        <div 
          className="absolute inset-0 rounded-full border-8 border-amber-600/80 bg-gradient-to-br from-amber-900/40 to-amber-950/60 shadow-2xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: gameState === 'spinning' ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          <div className="absolute inset-6 rounded-full border-4 border-amber-700/60 bg-gradient-to-br from-green-900 to-green-950">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-amber-500 rounded-full shadow-lg"></div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-6 border-r-6 border-t-8 border-l-transparent border-r-transparent border-t-yellow-500 z-10"></div>
        
        {winningNumber !== null && gameState !== 'betting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${
              getNumberColor(winningNumber) === 'red' ? 'bg-red-600' :
              getNumberColor(winningNumber) === 'black' ? 'bg-black' :
              'bg-green-600'
            } text-white shadow-2xl`}>
              {winningNumber}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouletteWheel;
