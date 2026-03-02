import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FlashNftShopProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

interface NFT {
  id: number;
  name: string;
  collection: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  blockchain: string;
  category: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  color: string;
  emoji: string;
  traits: string[];
  soldOut?: boolean;
}

const nfts: NFT[] = [
  {
    id: 1,
    name: 'CryptoPunk #7523',
    collection: 'CryptoPunks',
    description: 'Один из самых редких и ценных CryptoPunks — эпохальная NFT коллекция от Larva Labs, ставшая символом цифрового искусства. Пиксельный персонаж с уникальными атрибутами.',
    originalPrice: 11754000,
    salePrice: 2586000,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'Art',
    rarity: 'Legendary',
    color: 'from-orange-500 to-red-600',
    emoji: '👾',
    traits: ['Alien', 'Medical Mask', 'Knitted Cap'],
  },
  {
    id: 2,
    name: 'Bored Ape #8817',
    collection: 'BAYC',
    description: 'Bored Ape Yacht Club — легендарная коллекция из 10 000 уникальных NFT. Владельцы получают доступ в эксклюзивный клуб и дополнительные привилегии.',
    originalPrice: 3408000,
    salePrice: 750000,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Legendary',
    color: 'from-blue-500 to-indigo-600',
    emoji: '🦍',
    traits: ['Golden Fur', 'Laser Eyes', 'King Crown'],
  },
  {
    id: 3,
    name: 'Everydays: First 5000',
    collection: 'Beeple',
    description: 'Знаменитая работа художника Beeple — коллаж из 5000 работ, проданная на Christie\'s за рекордную сумму. Единственный экземпляр, навсегда вошедший в историю NFT.',
    originalPrice: 69346000,
    salePrice: 15256000,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'Art',
    rarity: 'Legendary',
    color: 'from-purple-500 to-pink-600',
    emoji: '🎨',
    traits: ['1/1 Unique', 'Christie\'s Auction', 'Historic Sale'],
    soldOut: false,
  },
  {
    id: 4,
    name: 'Azuki #9605',
    collection: 'Azuki',
    description: 'Azuki — культовая аниме-стилизованная коллекция от Chiru Labs. Один из самых узнаваемых брендов в NFT-пространстве с развитой экосистемой.',
    originalPrice: 420000,
    salePrice: 92000,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Epic',
    color: 'from-red-500 to-orange-500',
    emoji: '⛩️',
    traits: ['Red Spirit', 'Katana', 'Dragon Scale Armor'],
  },
  {
    id: 5,
    name: 'Pudgy Penguin #6873',
    collection: 'Pudgy Penguins',
    description: 'Pudgy Penguins — одна из самых популярных NFT коллекций с огромным комьюнити. Пингвины стали символом "уютного" криптосообщества и имеют реальные игрушки в продаже.',
    originalPrice: 285000,
    salePrice: 63000,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Epic',
    color: 'from-cyan-400 to-blue-500',
    emoji: '🐧',
    traits: ['Rainbow Jacket', 'Party Hat', 'Heart Eyes'],
  },
  {
    id: 6,
    name: 'Doodles #6914',
    collection: 'Doodles',
    description: 'Doodles — яркая NFT коллекция в пастельных тонах от художника Burnt Toast. Проект известен активным комьюнити и уникальным художественным стилем.',
    originalPrice: 198000,
    salePrice: 43500,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'Art',
    rarity: 'Rare',
    color: 'from-yellow-400 to-orange-400',
    emoji: '🌈',
    traits: ['Space Suit', 'Rainbow Background', 'Gold Halo'],
  },
  {
    id: 7,
    name: 'Moonbird #2642',
    collection: 'Moonbirds',
    description: 'Moonbirds от PROOF Collective — коллекция пиксельных сов, дающая доступ в эксклюзивное сообщество. Нестинг-механика позволяет зарабатывать пассивный доход.',
    originalPrice: 152000,
    salePrice: 33400,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Rare',
    color: 'from-indigo-500 to-purple-600',
    emoji: '🦉',
    traits: ['Cosmic', 'Diamond Eyes', 'Wizard Hat'],
  },
  {
    id: 8,
    name: 'World of Women #6822',
    collection: 'World of Women',
    description: 'World of Women — первая крупная женская NFT коллекция, ставшая символом инклюзивности в Web3. Поддерживается Snoop Dogg, Reese Witherspoon и другими звёздами.',
    originalPrice: 115000,
    salePrice: 25300,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Rare',
    color: 'from-pink-500 to-rose-500',
    emoji: '👸',
    traits: ['Queen Crown', 'Galaxy Background', 'Diamond Necklace'],
  },
  {
    id: 9,
    name: 'Clone X #13825',
    collection: 'Clone X',
    description: 'Clone X — NFT коллекция от RTFKT совместно с Nike. Высокодетализированные 3D аватары, открывающие доступ к виртуальной одежде и мерчу от Nike.',
    originalPrice: 89000,
    salePrice: 19600,
    discount: 78,
    blockchain: 'Ethereum',
    category: '3D',
    rarity: 'Rare',
    color: 'from-teal-500 to-emerald-600',
    emoji: '🤖',
    traits: ['Alien DNA', 'Nike Drip', 'Holographic Eyes'],
  },
  {
    id: 10,
    name: 'Meebits #12345',
    collection: 'Meebits',
    description: 'Meebits от Larva Labs — 20 000 уникальных 3D воксельных персонажей для метавселенных. Созданы теми же авторами, что и CryptoPunks.',
    originalPrice: 78000,
    salePrice: 17200,
    discount: 78,
    blockchain: 'Ethereum',
    category: '3D',
    rarity: 'Epic',
    color: 'from-amber-500 to-yellow-500',
    emoji: '🧊',
    traits: ['Dissected', 'Visitor', 'Rare Body'],
  },
  {
    id: 11,
    name: 'Otherdeeds #59906',
    collection: 'Otherside',
    description: 'Otherdeeds — земельные участки в метавселенной Otherside от Yuga Labs (создатели BAYC). Виртуальная недвижимость нового поколения с уникальными ресурсами.',
    originalPrice: 62000,
    salePrice: 13600,
    discount: 78,
    blockchain: 'ApeCoin',
    category: 'Land',
    rarity: 'Epic',
    color: 'from-green-500 to-teal-500',
    emoji: '🏝️',
    traits: ['Koda Presence', 'Biogenic Swamp', 'Rare Sediment'],
  },
  {
    id: 12,
    name: 'Mutant Ape #19847',
    collection: 'MAYC',
    description: 'Mutant Ape Yacht Club — дополнение к оригинальным Bored Apes. Владельцы BAYC применили сыворотку мутации, создав уникальных персонажей с необычными чертами.',
    originalPrice: 58000,
    salePrice: 12800,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Rare',
    color: 'from-lime-500 to-green-600',
    emoji: '🧬',
    traits: ['M3 Mutation', 'Blood Red Fur', 'Zombie Eyes'],
  },
  {
    id: 13,
    name: 'Art Blocks #312',
    collection: 'Chromie Squiggle',
    description: 'Chromie Squiggle — генеративное искусство от Snowfro, основателя Art Blocks. Каждая работа уникальна, генерируется алгоритмически. Коллекционная ценность только растёт.',
    originalPrice: 145000,
    salePrice: 31900,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'Generative',
    rarity: 'Legendary',
    color: 'from-violet-500 to-purple-600',
    emoji: '〰️',
    traits: ['Hyper', 'Full Spectrum', 'Bold'],
  },
  {
    id: 14,
    name: 'DeGods #4269',
    collection: 'DeGods',
    description: 'DeGods — элитная NFT коллекция из Solana-экосистемы, перешедшая на Ethereum. Строгая эстетика и сильное комьюнити сделали проект одним из топовых в индустрии.',
    originalPrice: 52000,
    salePrice: 11400,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Epic',
    color: 'from-slate-500 to-gray-700',
    emoji: '⚡',
    traits: ['Skeleton', 'Gold Chain', 'Third Eye'],
  },
  {
    id: 15,
    name: 'Invisible Friends #3842',
    collection: 'Invisible Friends',
    description: 'Invisible Friends — анимированные NFT от шведского художника Markus Magnusson. Уникальная концепция невидимых персонажей в стильной одежде покорила мировое комьюнити.',
    originalPrice: 48000,
    salePrice: 10600,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'Art',
    rarity: 'Rare',
    color: 'from-sky-500 to-blue-600',
    emoji: '👻',
    traits: ['Animated', 'Rare Outfit', 'Special Background'],
  },
  {
    id: 16,
    name: 'Cool Cats #4891',
    collection: 'Cool Cats',
    description: 'Cool Cats — одна из первых топовых NFT коллекций с харизматичными котами. Активное сообщество, официальные коллаборации и анимационный сериал.',
    originalPrice: 38000,
    salePrice: 8360,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Rare',
    color: 'from-blue-400 to-cyan-500',
    emoji: '😎',
    traits: ['Wild Mane', 'Sunglasses', 'Space Background'],
  },
  {
    id: 17,
    name: 'Fidenza #313',
    collection: 'Art Blocks',
    description: 'Fidenza от Tyler Hobbs — одна из самых ценных работ генеративного искусства. Органические криволинейные формы создаются уникальным алгоритмом для каждого токена.',
    originalPrice: 1000000,
    salePrice: 220000,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'Generative',
    rarity: 'Legendary',
    color: 'from-rose-500 to-pink-600',
    emoji: '🎭',
    traits: ['Turbulent', 'Wide', 'Many Colors'],
  },
  {
    id: 18,
    name: 'Ringers #879',
    collection: 'Art Blocks',
    description: 'Ringers от Dmitri Cherniak — минималистичные абстрактные работы с верёвками и штырями. Особо редкие экземпляры достигали семизначных сумм на аукционах.',
    originalPrice: 890000,
    salePrice: 196000,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'Generative',
    rarity: 'Legendary',
    color: 'from-stone-500 to-amber-600',
    emoji: '⭕',
    traits: ['Peach Peg', 'Wrapped', 'Clean'],
  },
  {
    id: 19,
    name: 'Penguins #7334',
    collection: 'Pudgy Penguins',
    description: 'Уникальный пингвин из иконической коллекции Pudgy Penguins с редкими атрибутами и высоким рейтингом редкости. Популярен в европейском NFT-сообществе.',
    originalPrice: 195000,
    salePrice: 42900,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Epic',
    color: 'from-cyan-500 to-teal-600',
    emoji: '🐧',
    traits: ['Black Tuxedo', 'Top Hat', 'Monocle'],
  },
  {
    id: 20,
    name: 'Sproto Gremlins #1812',
    collection: 'Sproto Gremlins',
    description: 'Sproto Gremlins — вирусная NFT коллекция с уникальными зелёными существами. Быстро набрала огромную аудиторию и вошла в топ продаж на OpenSea.',
    originalPrice: 32000,
    salePrice: 7040,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Rare',
    color: 'from-green-400 to-lime-500',
    emoji: '👺',
    traits: ['Rare Eyes', 'Gold Chain', 'Glitch Background'],
  },
  {
    id: 21,
    name: 'Milady Maker #8230',
    collection: 'Milady Maker',
    description: 'Milady Maker — культовая аниме-коллекция с преданным комьюнити. Получила мировую известность после твита Илона Маска. Символ новой волны NFT-культуры.',
    originalPrice: 28500,
    salePrice: 6270,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Rare',
    color: 'from-pink-400 to-fuchsia-500',
    emoji: '🎀',
    traits: ['Punk Hair', 'Plaid Shirt', 'Star Eyes'],
  },
  {
    id: 22,
    name: 'EtherRocks #45',
    collection: 'EtherRock',
    description: 'EtherRocks — один из первых NFT-проектов в истории (2017 г.). Простые изображения камней продавались за миллионы долларов. Исторический артефакт блокчейна.',
    originalPrice: 1300000,
    salePrice: 286000,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'Historical',
    rarity: 'Legendary',
    color: 'from-gray-500 to-stone-600',
    emoji: '🪨',
    traits: ['2017 Genesis', 'Ultra Rare', 'Historic Asset'],
  },
  {
    id: 23,
    name: 'Wrapped MoonCat #4581',
    collection: 'MoonCats',
    description: 'MoonCats — один из старейших NFT-проектов (2017 г.), забытый и переоткрытый в 2021 году. Пиксельные коты с уникальными цветовыми комбинациями и историческим значением.',
    originalPrice: 41000,
    salePrice: 9020,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'Historical',
    rarity: 'Epic',
    color: 'from-purple-400 to-violet-500',
    emoji: '🌙',
    traits: ['Rescued 2017', 'Unique Palette', 'OG Status'],
  },
  {
    id: 24,
    name: 'Sappy Seals #2271',
    collection: 'Sappy Seals',
    description: 'Sappy Seals — добрая и позитивная коллекция тюленей с активным благотворительным комьюнити. Проект выделяет часть дохода на защиту океанов и животных.',
    originalPrice: 24000,
    salePrice: 5280,
    discount: 78,
    blockchain: 'Ethereum',
    category: 'PFP',
    rarity: 'Common',
    color: 'from-blue-400 to-sky-500',
    emoji: '🦭',
    traits: ['Rainbow Background', 'Flower Crown', 'Star Earring'],
  },
];

const rarityConfig = {
  Common: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Обычный' },
  Rare: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Редкий' },
  Epic: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Эпический' },
  Legendary: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Легендарный' },
};

const formatPrice = (price: number) =>
  price >= 1000000
    ? `$${(price / 1000000).toFixed(2)}M`
    : price >= 1000
    ? `$${(price / 1000).toFixed(0)}K`
    : `$${price}`;

export const FlashNftShop = ({ user, onShowAuthDialog }: FlashNftShopProps) => {
  const { toast } = useToast();
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [walletAddress, setWalletAddress] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const categories = ['all', 'PFP', 'Art', 'Generative', '3D', 'Land', 'Historical'];

  const filtered = filter === 'all' ? nfts : nfts.filter(n => n.category === filter);

  const handleBuy = (nft: NFT) => {
    if (!user) { onShowAuthDialog(); return; }
    setSelectedNft(nft);
    setWalletAddress('');
  };

  const confirmPurchase = async () => {
    if (!selectedNft || !user) return;
    if (!walletAddress.trim()) {
      toast({ title: '❌ Укажите адрес', description: 'Введите адрес ETH кошелька', variant: 'destructive' });
      return;
    }
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      toast({ title: '❌ Неверный адрес', description: 'Адрес должен начинаться с 0x и содержать 42 символа', variant: 'destructive' });
      return;
    }
    if (user.balance < selectedNft.salePrice) {
      toast({ title: '❌ Недостаточно средств', description: `На балансе ${user.balance.toLocaleString()} USDT, нужно ${selectedNft.salePrice.toLocaleString()} USDT`, variant: 'destructive' });
      return;
    }
    setIsPurchasing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsPurchasing(false);
    toast({ title: '✅ Заявка отправлена', description: `NFT ${selectedNft.name} будет отправлен на ваш адрес` });
    setSelectedNft(null);
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/6 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0a1e] to-[#1a0a2e]">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-fuchsia-600/10 to-pink-600/15" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 p-4 sm:p-8 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                <Icon name="Image" size={28} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-violet-400 text-xs font-medium uppercase tracking-widest">Эксклюзивная коллекция</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">Flash NFT</h1>
                <p className="text-sm sm:text-base text-white/50 mt-1">Топовые NFT мира со скидкой 78% · Flash передача</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { label: 'Скидка', value: '78%', icon: 'TrendingDown', color: 'text-emerald-400' },
                { label: 'Коллекций', value: `${nfts.length}+`, icon: 'Layers', color: 'text-violet-400' },
                { label: 'Блокчейн', value: 'ETH', icon: 'Gem', color: 'text-blue-400' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-3 sm:p-4">
                  <Icon name={s.icon as string} size={16} className={`${s.color} mb-1.5`} />
                  <p className="text-lg sm:text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                filter === cat
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat === 'all' ? 'Все' : cat}
            </button>
          ))}
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map(nft => {
            const rarity = rarityConfig[nft.rarity];
            return (
              <div
                key={nft.id}
                className="group relative bg-[#0d0d1a] border border-white/8 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* NFT Image placeholder */}
                <div className={`relative h-44 sm:h-48 bg-gradient-to-br ${nft.color} flex items-center justify-center overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="text-6xl sm:text-7xl relative z-10 group-hover:scale-110 transition-transform duration-500">{nft.emoji}</span>

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start z-20">
                    <Badge className={`text-[10px] font-semibold px-2 py-0.5 ${rarity.bg} ${rarity.color} border ${rarity.border}`}>
                      {nft.rarity === 'Legendary' && <Icon name="Crown" size={9} className="mr-1" />}
                      {rarity.label}
                    </Badge>
                    <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold px-2">
                      −{nft.discount}%
                    </Badge>
                  </div>

                  {/* Collection */}
                  <div className="absolute bottom-2.5 left-2.5 z-20">
                    <p className="text-white/60 text-[10px]">{nft.collection}</p>
                    <p className="text-white font-bold text-sm leading-tight truncate max-w-[160px]">{nft.name}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className="text-[10px] bg-white/5 text-white/50 border-white/10">{nft.blockchain}</Badge>
                    <Badge className="text-[10px] bg-white/5 text-white/50 border-white/10">{nft.category}</Badge>
                  </div>

                  <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{nft.description}</p>

                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-white/30 text-[10px] line-through">{formatPrice(nft.originalPrice)}</p>
                      <p className="text-white font-bold text-base sm:text-lg leading-tight">{formatPrice(nft.salePrice)}</p>
                    </div>
                    <Button
                      onClick={() => handleBuy(nft)}
                      disabled={nft.soldOut}
                      className="h-8 px-3 text-xs bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-lg shrink-0 shadow-lg shadow-violet-500/20 transition-all"
                    >
                      {nft.soldOut ? 'Продано' : 'Купить'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={!!selectedNft} onOpenChange={() => setSelectedNft(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md p-0 border-0 bg-transparent shadow-none">
          {selectedNft && (
            <div className="bg-[#0a0a18] border border-white/10 rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
              <div className="h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

              {/* Header */}
              <div className={`relative h-28 bg-gradient-to-br ${selectedNft.color} flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 bg-black/30" />
                <span className="text-6xl relative z-10">{selectedNft.emoji}</span>
                <button
                  onClick={() => setSelectedNft(null)}
                  className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center text-white/60 hover:text-white"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div>
                  <p className="text-white/40 text-xs">{selectedNft.collection}</p>
                  <h3 className="text-white font-bold text-lg leading-tight">{selectedNft.name}</h3>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <Badge className={`text-[10px] ${rarityConfig[selectedNft.rarity].bg} ${rarityConfig[selectedNft.rarity].color} border ${rarityConfig[selectedNft.rarity].border}`}>
                      {rarityConfig[selectedNft.rarity].label}
                    </Badge>
                    <Badge className="text-[10px] bg-white/5 text-white/50 border-white/10">{selectedNft.blockchain}</Badge>
                    <Badge className="text-[10px] bg-white/5 text-white/50 border-white/10">{selectedNft.category}</Badge>
                  </div>
                </div>

                <p className="text-white/50 text-xs leading-relaxed">{selectedNft.description}</p>

                {/* Traits */}
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Атрибуты</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedNft.traits.map(t => (
                      <span key={t} className="px-2 py-1 rounded-lg bg-white/5 border border-white/8 text-white/60 text-[10px]">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="rounded-xl border border-white/8 divide-y divide-white/8">
                  <div className="flex justify-between items-center gap-3 px-4 py-2.5">
                    <span className="text-white/40 text-xs">Оригинальная цена</span>
                    <span className="text-white/40 text-sm line-through">{formatPrice(selectedNft.originalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 px-4 py-2.5">
                    <span className="text-white/40 text-xs">Скидка</span>
                    <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/20">−{selectedNft.discount}%</Badge>
                  </div>
                  <div className="flex justify-between items-center gap-3 px-4 py-3">
                    <span className="text-white/40 text-xs uppercase tracking-wider">К оплате</span>
                    <span className="text-white font-bold text-lg">{formatPrice(selectedNft.salePrice)}</span>
                  </div>
                </div>

                {/* Wallet input */}
                <div className="space-y-1.5">
                  <label className="text-white/30 text-[11px] uppercase tracking-widest">Адрес ETH кошелька</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={e => setWalletAddress(e.target.value)}
                      placeholder="0x... (42 символа)"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder:text-white/20 focus:border-violet-500/50 focus:outline-none transition-colors"
                      maxLength={42}
                    />
                    {walletAddress.length === 42 && (
                      <Icon name="CheckCircle2" size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2.5">
                  <Button
                    onClick={() => setSelectedNft(null)}
                    variant="outline"
                    className="w-20 border-white/10 text-white/40 hover:text-white/60 bg-transparent rounded-xl h-10 text-sm shrink-0"
                    disabled={isPurchasing}
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={confirmPurchase}
                    className="flex-1 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl h-10 text-sm shadow-lg shadow-violet-500/25 transition-all"
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <><Icon name="Loader2" size={15} className="mr-2 animate-spin" />Обработка...</>
                    ) : (
                      `Купить за ${formatPrice(selectedNft.salePrice)}`
                    )}
                  </Button>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashNftShop;
