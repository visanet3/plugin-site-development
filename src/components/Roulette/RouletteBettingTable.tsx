type BetType = 'red' | 'black' | 'green' | 'even' | 'odd' | 'low' | 'high' | number;

interface RouletteBettingTableProps {
  selectedBetType: BetType | null;
  setSelectedBetType: (type: BetType) => void;
  getNumberColor: (num: number) => 'red' | 'black' | 'green';
}

const RouletteBettingTable = ({ selectedBetType, setSelectedBetType, getNumberColor }: RouletteBettingTableProps) => {
  return (
    <div className="bg-green-900/40 p-6 rounded-lg border-2 border-amber-700/30">
      <div className="flex gap-2">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setSelectedBetType('green')}
            className={`w-12 h-36 bg-green-600 hover:bg-green-700 text-white font-bold rounded flex items-center justify-center text-2xl transition-all ${
              selectedBetType === 'green' ? 'ring-4 ring-yellow-400' : ''
            }`}
          >
            0
          </button>
        </div>

        <div className="grid grid-cols-12 gap-[2px]">
          {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedBetType(num)}
              className={`w-12 h-12 ${
                getNumberColor(num) === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-900'
              } text-white font-bold rounded flex items-center justify-center transition-all ${
                selectedBetType === num ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              {num}
            </button>
          ))}
          {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedBetType(num)}
              className={`w-12 h-12 ${
                getNumberColor(num) === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-900'
              } text-white font-bold rounded flex items-center justify-center transition-all ${
                selectedBetType === num ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              {num}
            </button>
          ))}
          {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedBetType(num)}
              className={`w-12 h-12 ${
                getNumberColor(num) === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-900'
              } text-white font-bold rounded flex items-center justify-center transition-all ${
                selectedBetType === num ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 mt-4">
        <button
          onClick={() => setSelectedBetType('low')}
          className={`col-span-2 py-3 bg-amber-800/40 hover:bg-amber-800/60 border-2 border-amber-600/50 text-white font-bold rounded transition-all ${
            selectedBetType === 'low' ? 'ring-4 ring-yellow-400' : ''
          }`}
        >
          1-18
        </button>
        <button
          onClick={() => setSelectedBetType('even')}
          className={`py-3 bg-amber-800/40 hover:bg-amber-800/60 border-2 border-amber-600/50 text-white font-bold rounded transition-all ${
            selectedBetType === 'even' ? 'ring-4 ring-yellow-400' : ''
          }`}
        >
          ЧЕТН
        </button>
        <button
          onClick={() => setSelectedBetType('odd')}
          className={`py-3 bg-amber-800/40 hover:bg-amber-800/60 border-2 border-amber-600/50 text-white font-bold rounded transition-all ${
            selectedBetType === 'odd' ? 'ring-4 ring-yellow-400' : ''
          }`}
        >
          НЕЧТ
        </button>
        <button
          onClick={() => setSelectedBetType('high')}
          className={`col-span-2 py-3 bg-amber-800/40 hover:bg-amber-800/60 border-2 border-amber-600/50 text-white font-bold rounded transition-all ${
            selectedBetType === 'high' ? 'ring-4 ring-yellow-400' : ''
          }`}
        >
          19-36
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          onClick={() => setSelectedBetType('red')}
          className={`py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-lg transition-all ${
            selectedBetType === 'red' ? 'ring-4 ring-yellow-400' : ''
          }`}
        >
          🔴 КРАСНОЕ
        </button>
        <button
          onClick={() => setSelectedBetType('black')}
          className={`py-4 bg-black hover:bg-gray-900 text-white font-bold rounded text-lg transition-all ${
            selectedBetType === 'black' ? 'ring-4 ring-yellow-400' : ''
          }`}
        >
          ⚫ ЧЕРНОЕ
        </button>
      </div>
    </div>
  );
};

export default RouletteBettingTable;
