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
  image: string;
  traits: string[];
  soldOut?: boolean;
}

const IMG = {
  punk: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/0bed1939-40ff-4ff1-9e92-92cc8fa96df6.jpg',
  bayc: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/04fd9a0e-83df-4c3e-8b8c-247547a127ff.jpg',
  azuki: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/563c609a-2e64-49e1-a9e4-72007c0f0254.jpg',
  pudgy: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/aabb3318-2777-4a38-927f-190b02e529ff.jpg',
  doodles: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/673f24ae-53c3-4c1a-9982-a1a9d53a1d23.jpg',
  moonbird: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/0fc35a8a-c3b4-41c5-8851-29f27ee90b7c.jpg',
  cloneX: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/9bca23e7-83c0-46d8-91f7-b0e3abc9b9f2.jpg',
  artblocks: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/e49e88ba-ee04-42e1-85ad-8d7f876081b9.jpg',
  mayc: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/f775b20b-43ba-4403-9d79-ff79b84f029f.jpg',
  degods: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/f578c3b2-33b1-4248-b2a8-4ce424760a03.jpg',
  wow: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/0bfab606-7bb3-4448-87e2-d9db412537d0.jpg',
  invisible: 'https://cdn.poehali.dev/projects/6d3b4148-043d-4749-9e28-f8a525e15c33/files/0a969109-6dee-41a2-8cd6-f0ef9bd7e121.jpg',
};

const nfts: NFT[] = [
  { id: 1, name: 'CryptoPunk #7523', collection: 'CryptoPunks', description: 'Один из самых редких CryptoPunks — эпохальная NFT коллекция от Larva Labs. Пиксельный Alien с Medical Mask — один из 9 существующих пришельцев.', originalPrice: 11754000, salePrice: 2586000, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Legendary', image: IMG.punk, traits: ['Alien', 'Medical Mask', 'Knitted Cap'] },
  { id: 2, name: 'Bored Ape #8817', collection: 'BAYC', description: 'Bored Ape Yacht Club — легендарная коллекция из 10 000 уникальных NFT. Владельцы получают доступ в эксклюзивный клуб и дополнительные привилегии.', originalPrice: 3408000, salePrice: 750000, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.bayc, traits: ['Golden Fur', 'Laser Eyes', 'King Crown'] },
  { id: 3, name: 'Azuki #9605', collection: 'Azuki', description: 'Azuki — культовая аниме-стилизованная коллекция от Chiru Labs. Один из самых узнаваемых брендов в NFT-пространстве с развитой экосистемой.', originalPrice: 420000, salePrice: 92000, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.azuki, traits: ['Red Spirit', 'Katana', 'Dragon Scale Armor'] },
  { id: 4, name: 'Pudgy Penguin #6873', collection: 'Pudgy Penguins', description: 'Pudgy Penguins — одна из самых популярных NFT коллекций. Пингвины стали символом "уютного" криптосообщества и имеют реальные игрушки в продаже.', originalPrice: 285000, salePrice: 63000, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.pudgy, traits: ['Rainbow Jacket', 'Party Hat', 'Heart Eyes'] },
  { id: 5, name: 'Doodles #6914', collection: 'Doodles', description: 'Doodles — яркая NFT коллекция в пастельных тонах от художника Burnt Toast. Проект известен активным комьюнити и уникальным художественным стилем.', originalPrice: 198000, salePrice: 43500, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Rare', image: IMG.doodles, traits: ['Space Suit', 'Rainbow Background', 'Gold Halo'] },
  { id: 6, name: 'Moonbird #2642', collection: 'Moonbirds', description: 'Moonbirds от PROOF Collective — коллекция пиксельных сов. Нестинг-механика позволяет зарабатывать пассивный доход держателям токенов.', originalPrice: 152000, salePrice: 33400, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Rare', image: IMG.moonbird, traits: ['Cosmic', 'Diamond Eyes', 'Wizard Hat'] },
  { id: 7, name: 'Clone X #13825', collection: 'Clone X', description: 'Clone X — NFT коллекция от RTFKT совместно с Nike. Высокодетализированные 3D аватары, открывающие доступ к виртуальной одежде от Nike.', originalPrice: 89000, salePrice: 19600, discount: 78, blockchain: 'Ethereum', category: '3D', rarity: 'Rare', image: IMG.cloneX, traits: ['Alien DNA', 'Nike Drip', 'Holographic Eyes'] },
  { id: 8, name: 'Fidenza #313', collection: 'Art Blocks', description: 'Fidenza от Tyler Hobbs — одна из самых ценных работ генеративного искусства. Органические криволинейные формы создаются уникальным алгоритмом.', originalPrice: 1000000, salePrice: 220000, discount: 78, blockchain: 'Ethereum', category: 'Generative', rarity: 'Legendary', image: IMG.artblocks, traits: ['Turbulent', 'Wide', 'Full Spectrum'] },
  { id: 9, name: 'Mutant Ape #19847', collection: 'MAYC', description: 'Mutant Ape Yacht Club — дополнение к оригинальным Bored Apes. Владельцы BAYC применили сыворотку мутации, создав уникальных персонажей.', originalPrice: 58000, salePrice: 12800, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Rare', image: IMG.mayc, traits: ['M3 Mutation', 'Blood Red Fur', 'Zombie Eyes'] },
  { id: 10, name: 'DeGods #4269', collection: 'DeGods', description: 'DeGods — элитная NFT коллекция из Solana-экосистемы, перешедшая на Ethereum. Строгая эстетика и сильное комьюнити.', originalPrice: 52000, salePrice: 11400, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.degods, traits: ['Skeleton', 'Gold Chain', 'Third Eye'] },
  { id: 11, name: 'World of Women #6822', collection: 'World of Women', description: 'World of Women — первая крупная женская NFT коллекция, ставшая символом инклюзивности в Web3. Поддерживается Snoop Dogg и Reese Witherspoon.', originalPrice: 115000, salePrice: 25300, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Rare', image: IMG.wow, traits: ['Queen Crown', 'Galaxy Background', 'Diamond Necklace'] },
  { id: 12, name: 'Invisible Friends #3842', collection: 'Invisible Friends', description: 'Анимированные NFT от шведского художника Markus Magnusson. Невидимые персонажи в стильной одежде покорили мировое комьюнити.', originalPrice: 48000, salePrice: 10600, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Rare', image: IMG.invisible, traits: ['Animated', 'Rare Outfit', 'Special Background'] },
  { id: 13, name: 'Bored Ape #3749', collection: 'BAYC', description: 'Редкий Bored Ape с золотой шерстью и уникальным фоном. Один из самых востребованных в коллекции — входит в топ-100 по редкости.', originalPrice: 2850000, salePrice: 627000, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.bayc, traits: ['Solid Gold Fur', 'Bored Pizza', 'Blue Beam Eyes'] },
  { id: 14, name: 'CryptoPunk #3100', collection: 'CryptoPunks', description: 'Ещё один легендарный Alien CryptoPunk с редчайшим атрибутом — повязкой на голове. Один из самых дорогих NFT в истории.', originalPrice: 7580000, salePrice: 1668000, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Legendary', image: IMG.punk, traits: ['Alien', 'Headband'] },
  { id: 15, name: 'Azuki #1337', collection: 'Azuki', description: 'Культовый Azuki с нумерацией 1337 — особо ценится среди коллекционеров. Уникальное сочетание атрибутов делает его одним из топовых в коллекции.', originalPrice: 380000, salePrice: 83600, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.azuki, traits: ['Elite Status', 'Cherry Blossom', 'White Robe'] },
  { id: 16, name: 'Ringers #879', collection: 'Art Blocks', description: 'Ringers от Dmitri Cherniak — минималистичные абстрактные работы с верёвками и штырями. Особо редкие экземпляры достигали семизначных сумм на аукционах.', originalPrice: 890000, salePrice: 196000, discount: 78, blockchain: 'Ethereum', category: 'Generative', rarity: 'Legendary', image: IMG.artblocks, traits: ['Peach Peg', 'Wrapped', 'Clean'] },
  { id: 17, name: 'Pudgy Penguin #2711', collection: 'Pudgy Penguins', description: 'Эксклюзивный пингвин в чёрном смокинге с цилиндром и моноклем. Входит в топ-200 самых редких экземпляров коллекции Pudgy Penguins.', originalPrice: 195000, salePrice: 42900, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.pudgy, traits: ['Black Tuxedo', 'Top Hat', 'Monocle'] },
  { id: 18, name: 'Clone X #5891', collection: 'Clone X', description: 'RTFKT x Nike Clone X с человеческой ДНК и премиальной экипировкой. Один из самых узнаваемых 3D аватаров в метавселенной.', originalPrice: 74000, salePrice: 16300, discount: 78, blockchain: 'Ethereum', category: '3D', rarity: 'Rare', image: IMG.cloneX, traits: ['Human DNA', 'Premium Gear', 'Cyber Eyes'] },
  { id: 19, name: 'Moonbird #8103', collection: 'Moonbirds', description: 'Редкая сова Moonbird с деревянным оперением и тиарой. Прошла максимальное гнездование — статус Diamond Nesting.', originalPrice: 130000, salePrice: 28600, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.moonbird, traits: ['Wood', 'Tiara', 'Diamond Nesting'] },
  { id: 20, name: 'Doodles #4201', collection: 'Doodles', description: 'Редкие Doodles с космическим скафандром и розовым фоном. Один из самых желанных экземпляров для коллекционеров проекта.', originalPrice: 165000, salePrice: 36300, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Epic', image: IMG.doodles, traits: ['Space Helmet', 'Pink Background', 'Fire Mouth'] },
  { id: 21, name: 'Meebits #12345', collection: 'Meebits', description: 'Meebits от Larva Labs — 3D воксельные персонажи для метавселенных. Созданы теми же авторами, что и CryptoPunks. Редкий Dissected Meebit.', originalPrice: 78000, salePrice: 17200, discount: 78, blockchain: 'Ethereum', category: '3D', rarity: 'Epic', image: IMG.punk, traits: ['Dissected', 'Visitor', 'Rare Body'] },
  { id: 22, name: 'Otherdeeds #59906', collection: 'Otherside', description: 'Земельный участок в метавселенной Otherside от Yuga Labs. Присутствие Koda и редкие ресурсы делают этот участок особо ценным.', originalPrice: 62000, salePrice: 13600, discount: 78, blockchain: 'ApeCoin', category: 'Land', rarity: 'Epic', image: IMG.bayc, traits: ['Koda Presence', 'Biogenic Swamp', 'Rare Sediment'] },
  { id: 23, name: 'World of Women #1428', collection: 'WoW Galaxy', description: 'World of Women Galaxy — расширенная коллекция с инопланетными героинями. Уникальная комбинация атрибутов, поддержка Disney и крупных брендов.', originalPrice: 92000, salePrice: 20200, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.wow, traits: ['Alien Skin', 'Space Background', 'Crystal Crown'] },
  { id: 24, name: 'DeGods #777', collection: 'DeGods', description: 'DeGods #777 с особой нумерацией — очень редкий и ценный экземпляр. Три семёрки означают максимальную удачу в комьюнити DeGods.', originalPrice: 68000, salePrice: 14960, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.degods, traits: ['Lucky 777', 'Gold Armor', 'Glowing Eyes'] },
  { id: 25, name: 'Art Blocks #99', collection: 'Chromie Squiggle', description: 'Chromie Squiggle от Snowfro — ранний экземпляр с уникальным цветовым решением. Основоположник жанра генеративного искусства на блокчейне.', originalPrice: 520000, salePrice: 114400, discount: 78, blockchain: 'Ethereum', category: 'Generative', rarity: 'Legendary', image: IMG.artblocks, traits: ['Hyper', 'Full Spectrum', 'Bold Early'] },
  { id: 26, name: 'Cool Cats #4891', collection: 'Cool Cats', description: 'Cool Cats — одна из первых топовых NFT коллекций с харизматичными котами. Официальные коллаборации и анимационный сериал.', originalPrice: 38000, salePrice: 8360, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Rare', image: IMG.doodles, traits: ['Wild Mane', 'Sunglasses', 'Space Background'] },
  { id: 27, name: 'Milady Maker #8230', collection: 'Milady Maker', description: 'Milady Maker — культовая аниме-коллекция. Получила мировую известность после твита Илона Маска. Символ новой волны NFT-культуры.', originalPrice: 28500, salePrice: 6270, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Rare', image: IMG.azuki, traits: ['Punk Hair', 'Plaid Shirt', 'Star Eyes'] },
  { id: 28, name: 'EtherRocks #45', collection: 'EtherRock', description: 'EtherRocks — один из первых NFT-проектов (2017 г.). Простые изображения камней продавались за миллионы. Исторический артефакт блокчейна.', originalPrice: 1300000, salePrice: 286000, discount: 78, blockchain: 'Ethereum', category: 'Historical', rarity: 'Legendary', image: IMG.punk, traits: ['2017 Genesis', 'Ultra Rare', 'Historic Asset'] },
  { id: 29, name: 'Wrapped MoonCat #4581', collection: 'MoonCats', description: 'MoonCats — один из старейших NFT-проектов (2017 г.), забытый и переоткрытый в 2021 году. Пиксельные коты с исторической ценностью.', originalPrice: 41000, salePrice: 9020, discount: 78, blockchain: 'Ethereum', category: 'Historical', rarity: 'Epic', image: IMG.punk, traits: ['Rescued 2017', 'Unique Palette', 'OG Status'] },
  { id: 30, name: 'Sproto Gremlins #1812', collection: 'Sproto Gremlins', description: 'Вирусная NFT коллекция с зелёными существами. Быстро набрала огромную аудиторию и вошла в топ продаж на OpenSea.', originalPrice: 32000, salePrice: 7040, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Rare', image: IMG.mayc, traits: ['Rare Eyes', 'Gold Chain', 'Glitch Background'] },
  { id: 31, name: 'BAYC #9999', collection: 'BAYC', description: 'Последний выпущенный Bored Ape с ультраредкими атрибутами. Нумерация #9999 делает его особо коллекционным экземпляром в среде фанатов BAYC.', originalPrice: 4200000, salePrice: 924000, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.bayc, traits: ['Solid Gold', 'X Eyes', 'Sea Captain Hat'] },
  { id: 32, name: 'Azuki Elementals #512', collection: 'Azuki Elementals', description: 'Azuki Elementals — вторая коллекция от Chiru Labs с элементальной тематикой. Огненный элементаль с эксклюзивными атрибутами и редкими цветами.', originalPrice: 180000, salePrice: 39600, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.azuki, traits: ['Fire Element', 'Lava Skin', 'Phoenix Wings'] },
  { id: 33, name: 'Pudgy Rods #821', collection: 'Lil Pudgys', description: 'Lil Pudgys — дочерняя коллекция Pudgy Penguins. Маленькие пингвины для метавселенной с уникальными аксессуарами и редкими атрибутами.', originalPrice: 48000, salePrice: 10560, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Rare', image: IMG.pudgy, traits: ['Mini Penguin', 'Gold Accessories', 'Ultra Rare'] },
  { id: 34, name: 'Nouns #420', collection: 'Nouns', description: 'Nouns DAO — один из самых инновационных NFT-проектов с уникальной governance-моделью. Каждый Noun выставляется на аукцион каждые 24 часа.', originalPrice: 95000, salePrice: 20900, discount: 78, blockchain: 'Ethereum', category: 'Generative', rarity: 'Epic', image: IMG.artblocks, traits: ['Glasses', 'Body', 'Background #420'] },
  { id: 35, name: 'Beanz #9001', collection: 'Beanz', description: 'Beanz — спутники Azuki, ставшие самостоятельной культовой коллекцией. Редкий экземпляр с голубой кожей и золотыми аксессуарами.', originalPrice: 42000, salePrice: 9240, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Rare', image: IMG.azuki, traits: ['Blue Skin', 'Gold Ring', 'Third Eye'] },
  { id: 36, name: 'Otherdeed Expanded #1122', collection: 'Otherside', description: 'Otherdeeds Expanded — расширенная версия виртуальной недвижимости Otherside. Дополнительные ресурсы и Koda-существа делают его особенно ценным.', originalPrice: 85000, salePrice: 18700, discount: 78, blockchain: 'Ethereum', category: 'Land', rarity: 'Epic', image: IMG.bayc, traits: ['Koda', 'Expanded Plot', 'Rare Resources'] },
  { id: 37, name: 'CryptoPunk #9998', collection: 'CryptoPunks', description: 'Редчайший CryptoPunk Zombie с уникальными атрибутами. Один из 88 зомби-панков — вторая по редкости категория после Alien.', originalPrice: 4800000, salePrice: 1056000, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Legendary', image: IMG.punk, traits: ['Zombie', 'Wild Hair', 'Big Beard'] },
  { id: 38, name: 'Moonbird #5000', collection: 'Moonbirds', description: 'Moonbird с Legendary нестингом — бриллиантовый статус после максимального времени стейкинга. Открывает доступ к эксклюзивным PROOF Collective событиям.', originalPrice: 210000, salePrice: 46200, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.moonbird, traits: ['Diamond Nest', 'Legendary Status', 'Cosmic Eyes'] },
  { id: 39, name: 'MAYC #3669', collection: 'MAYC', description: 'Мутант с редчайшей M2 Mega мутацией и уникальным сочетанием атрибутов. Входит в топ-50 самых редких мутантных обезьян по рейтингу редкости.', originalPrice: 82000, salePrice: 18040, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.mayc, traits: ['M2 Mega', 'Bored Pizza', 'Dagger'] },
  { id: 40, name: 'Chromie Squiggle #7777', collection: 'Art Blocks', description: 'Chromie Squiggle с нумерацией 7777 — особо ценный экземпляр. Редкий "Hyper" тип с полным спектром цветов и максимальной амплитудой.', originalPrice: 680000, salePrice: 149600, discount: 78, blockchain: 'Ethereum', category: 'Generative', rarity: 'Legendary', image: IMG.artblocks, traits: ['Hyper Bold', 'Full Spectrum', 'Lucky 7777'] },
  { id: 41, name: 'Clone X #1001', collection: 'Clone X', description: 'Ранний Clone X с редким Demon DNA. Создан совместно RTFKT и Takashi Murakami — культовым японским художником, что делает его особо ценным.', originalPrice: 145000, salePrice: 31900, discount: 78, blockchain: 'Ethereum', category: '3D', rarity: 'Epic', image: IMG.cloneX, traits: ['Demon DNA', 'Murakami Design', 'Special Drop'] },
  { id: 42, name: 'Doodles #2222', collection: 'Doodles', description: 'Doodles с уникальным сочетанием флисовой одежды и радужного фона. Нумерация 2222 высоко ценится среди коллекционеров проекта.', originalPrice: 145000, salePrice: 31900, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Epic', image: IMG.doodles, traits: ['Fleece Outfit', 'Rainbow Bg', 'Disco Ball'] },
  { id: 43, name: 'DeGods #1111', collection: 'DeGods', description: 'Легендарный DeGod с нумерацией 1111 — один из самых желанных в коллекции. Особые атрибуты и т.н. "angel status" в комьюнити.', originalPrice: 88000, salePrice: 19360, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.degods, traits: ['Angel Status', 'White Robe', 'Halo Crown'] },
  { id: 44, name: 'Bored Ape #2087', collection: 'BAYC', description: 'Bored Ape с редким Trippy Fur и бесценным выражением лица. Входит в 1% самых редких Apes по рейтингу на rarity.tools.', originalPrice: 3900000, salePrice: 858000, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.bayc, traits: ['Trippy Fur', 'Cyborg Eyes', 'Vietnam Era Hat'] },
  { id: 45, name: 'Pudgy Penguin #1', collection: 'Pudgy Penguins', description: 'Первый Pudgy Penguin — исторический экземпляр с нумерацией #1. Максимально редкий коллекционный актив с культурной и исторической ценностью.', originalPrice: 350000, salePrice: 77000, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.pudgy, traits: ['Genesis', 'Rare Costume', 'OG Status'] },
  { id: 46, name: 'Azuki #5145', collection: 'Azuki', description: 'Редкий Azuki Earth — элементальный персонаж с уникальными атрибутами земли. Один из самых желанных в расширенной экосистеме Azuki.', originalPrice: 290000, salePrice: 63800, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.azuki, traits: ['Earth Element', 'Stone Armor', 'Forest Eyes'] },
  { id: 47, name: 'MAYC #8520', collection: 'MAYC', description: 'Мутантная обезьяна с редкой Serum M3 — высшего уровня мутации. Золотая шерсть с психоделическими глазами — один из топовых MAYC по редкости.', originalPrice: 95000, salePrice: 20900, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Epic', image: IMG.mayc, traits: ['M3 Serum', 'Gold Fur', 'Psychedelic Eyes'] },
  { id: 48, name: 'WoW #3781', collection: 'World of Women', description: 'World of Women с редкими атрибутами — пурпурные волосы и космический фон. Часть дохода от продаж направляется на поддержку женщин в криптосфере.', originalPrice: 98000, salePrice: 21560, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Rare', image: IMG.wow, traits: ['Purple Hair', 'Space Background', 'Pearl Earring'] },
  { id: 49, name: 'Invisible Friends #499', collection: 'Invisible Friends', description: 'Rare Invisible Friend в самом начале нумерации — особо ценится коллекционерами. Редкая анимация и уникальное цветовое решение одежды.', originalPrice: 72000, salePrice: 15840, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Epic', image: IMG.invisible, traits: ['Animated', 'Gold Outfit', 'Early Mint'] },
  { id: 50, name: 'Nouns #1', collection: 'Nouns', description: 'Самый первый Noun — исторически уникальный токен. Голосовой вес в Nouns DAO и вечное место в истории самого инновационного NFT-проекта.', originalPrice: 450000, salePrice: 99000, discount: 78, blockchain: 'Ethereum', category: 'Generative', rarity: 'Legendary', image: IMG.artblocks, traits: ['Genesis Noun', 'DAO Founder', 'Unique #1'] },
  { id: 51, name: 'Moonbird #1', collection: 'Moonbirds', description: 'Первый Moonbird — исторический актив коллекции PROOF Collective. Максимальный Diamond Nesting статус и полная история гнездования с момента минта.', originalPrice: 420000, salePrice: 92400, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.moonbird, traits: ['Genesis', 'Diamond Nest', 'PROOF Founder'] },
  { id: 52, name: 'Chromie Squiggle #1', collection: 'Art Blocks', description: 'Первая Chromie Squiggle в истории Art Blocks. Абсолютный исторический артефакт цифрового искусства — нумерация #1 делает её бесценной.', originalPrice: 2100000, salePrice: 462000, discount: 78, blockchain: 'Ethereum', category: 'Generative', rarity: 'Legendary', image: IMG.artblocks, traits: ['Genesis', 'First Ever', 'Hyper Full Spectrum'] },
  { id: 53, name: 'Cool Cat #1', collection: 'Cool Cats', description: 'Первый Cool Cat — ранний и очень ценный токен одной из первых топовых NFT коллекций. Эксклюзивные атрибуты основателя проекта.', originalPrice: 185000, salePrice: 40700, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.doodles, traits: ['Genesis Cat', 'OG Status', 'Founder Traits'] },
  { id: 54, name: 'BAYC #0', collection: 'BAYC', description: 'Нулевой Bored Ape — самый ранний токен всей коллекции. Входит в ультраредкую группу самых первых Apes с историческим статусом Genesis.', originalPrice: 9200000, salePrice: 2024000, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.bayc, traits: ['Genesis Ape', 'Yacht Club Founder', 'Legendary Status'] },
  { id: 55, name: 'Loot #1', collection: 'Loot', description: 'Loot (for Adventurers) — минималистичные NFT с текстовым описанием предметов. Первый токен — основа всей лор-системы. Один из самых влиятельных NFT-проектов.', originalPrice: 620000, salePrice: 136400, discount: 78, blockchain: 'Ethereum', category: 'Generative', rarity: 'Legendary', image: IMG.artblocks, traits: ['Divine Robe', 'Warhammer of Fury', 'Pendant of Reflection'] },
  { id: 56, name: 'Azuki #0', collection: 'Azuki', description: 'Нулевой Azuki — genesis-токен всей коллекции. Абсолютно уникальный по статусу и редкости, входит в личную коллекцию основателя Zagabond.', originalPrice: 1500000, salePrice: 330000, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.azuki, traits: ['Genesis', 'Founder Item', 'Ultra Rare'] },
  { id: 57, name: 'CryptoPunk #0', collection: 'CryptoPunks', description: 'Нулевой CryptoPunk — абсолютный исторический артефакт. Первый когда-либо сминченный Punk — символ начала эпохи NFT и цифрового искусства.', originalPrice: 18500000, salePrice: 4070000, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Legendary', image: IMG.punk, traits: ['Genesis Punk', 'First Ever', 'Historic NFT'] },
  { id: 58, name: 'Meebits #0', collection: 'Meebits', description: 'Первый Meebit от Larva Labs — генезис-токен 3D воксельной коллекции. Абсолютная редкость, доказанная блокчейном с 2021 года.', originalPrice: 380000, salePrice: 83600, discount: 78, blockchain: 'Ethereum', category: '3D', rarity: 'Legendary', image: IMG.punk, traits: ['Genesis', 'First Meebit', 'Larva Labs OG'] },
  { id: 59, name: 'Doodles #0', collection: 'Doodles', description: 'Нулевые Doodles — самый ранний токен культовой коллекции от Burnt Toast. Уникальные genesis-атрибуты и максимальный статус в комьюнити.', originalPrice: 420000, salePrice: 92400, discount: 78, blockchain: 'Ethereum', category: 'Art', rarity: 'Legendary', image: IMG.doodles, traits: ['Genesis Doodle', 'OG Holder', 'First Mint'] },
  { id: 60, name: 'WoW #1', collection: 'World of Women', description: 'Первая World of Women — исторический genesis-токен коллекции, ставшей символом феминизма и инклюзивности в Web3-пространстве.', originalPrice: 280000, salePrice: 61600, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.wow, traits: ['Genesis', 'WoW Founder', 'First Queen'] },
  { id: 61, name: 'DeGods #1', collection: 'DeGods', description: 'Первый DeGod — genesis-токен одного из самых элитных NFT-проектов. Особый статус в DAO и уникальные genesis-атрибуты основателя.', originalPrice: 210000, salePrice: 46200, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.degods, traits: ['Genesis God', 'Founder DAO', 'White Armor'] },
  { id: 62, name: 'Clone X #0', collection: 'Clone X', description: 'Нулевой Clone X от RTFKT x Nike — genesis 3D аватар, созданный первым в коллекции. Историческая ценность усилена коллаборацией с Nike.', originalPrice: 320000, salePrice: 70400, discount: 78, blockchain: 'Ethereum', category: '3D', rarity: 'Legendary', image: IMG.cloneX, traits: ['Genesis Clone', 'Nike First', 'RTFKT OG'] },
  { id: 63, name: 'Milady #1', collection: 'Milady Maker', description: 'Первая Milady — genesis-токен одной из самых культовых и противоречивых коллекций. После твита Илона Маска стала символом NFT-культуры нового поколения.', originalPrice: 95000, salePrice: 20900, discount: 78, blockchain: 'Ethereum', category: 'PFP', rarity: 'Legendary', image: IMG.azuki, traits: ['Genesis Milady', 'Elon Tweet Fame', 'Cult Status'] },
  { id: 64, name: 'Nouns #420', collection: 'Nouns', description: 'Noun #420 — один из самых мемных и желанных токенов Nouns DAO. Голосовой вес, вечная история в блокчейне и культовая нумерация 420.', originalPrice: 145000, salePrice: 31900, discount: 78, blockchain: 'Ethereum', category: 'Generative', rarity: 'Epic', image: IMG.artblocks, traits: ['420 Meme', 'DAO Power', 'Glasses'] },
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
                { label: 'NFT', value: `${nfts.length}`, icon: 'Layers', color: 'text-violet-400' },
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
                {/* NFT Image */}
                <div className="relative h-44 sm:h-48 overflow-hidden">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start z-10">
                    <Badge className={`text-[10px] font-semibold px-2 py-0.5 ${rarity.bg} ${rarity.color} border ${rarity.border} backdrop-blur-sm`}>
                      {nft.rarity === 'Legendary' && <Icon name="Crown" size={9} className="mr-1" />}
                      {rarity.label}
                    </Badge>
                    <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold px-2 backdrop-blur-sm">
                      −{nft.discount}%
                    </Badge>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 z-10">
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
        <DialogContent className="max-w-[95vw] sm:max-w-md p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
          {selectedNft && (
            <div className="bg-[#0a0a18] border border-white/10 rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
              <div className="h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

              {/* Header with image */}
              <div className="relative h-32 overflow-hidden">
                <img src={selectedNft.image} alt={selectedNft.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
                <button
                  onClick={() => setSelectedNft(null)}
                  className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <Icon name="X" size={14} />
                </button>
                <div className="absolute bottom-3 left-4 z-10">
                  <p className="text-white/50 text-[11px]">{selectedNft.collection}</p>
                  <h3 className="text-white font-bold text-base leading-tight">{selectedNft.name}</h3>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`text-[10px] ${rarityConfig[selectedNft.rarity].bg} ${rarityConfig[selectedNft.rarity].color} border ${rarityConfig[selectedNft.rarity].border}`}>
                    {rarityConfig[selectedNft.rarity].label}
                  </Badge>
                  <Badge className="text-[10px] bg-white/5 text-white/50 border-white/10">{selectedNft.blockchain}</Badge>
                  <Badge className="text-[10px] bg-white/5 text-white/50 border-white/10">{selectedNft.category}</Badge>
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
                    <span className="text-white/40 text-xs shrink-0">Оригинал</span>
                    <span className="text-white/40 text-sm line-through">{formatPrice(selectedNft.originalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 px-4 py-2.5">
                    <span className="text-white/40 text-xs shrink-0">Скидка</span>
                    <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/20">−{selectedNft.discount}%</Badge>
                  </div>
                  <div className="flex justify-between items-center gap-3 px-4 py-3">
                    <span className="text-white/40 text-xs uppercase tracking-wider shrink-0">К оплате</span>
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
                <div className="flex gap-2.5 pb-1">
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
                      `Купить ${formatPrice(selectedNft.salePrice)}`
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
