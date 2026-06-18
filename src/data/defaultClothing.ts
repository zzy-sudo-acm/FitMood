import { ClothingItem, ColorProfile, Fit, GarmentLength, Material, Pattern, Rating } from '../types';

// 第一次打开就有衣服可搭：覆盖上装/下装/连衣裙/外套/鞋/包/配饰，
// 能跑出上课、通勤、约会、面试、拍照、运动等多套搭配。
const base = 1730000000000;
let n = 0;
const t = () => base + n++ * 1000;

type AestheticFields = Pick<ClothingItem, 'pattern' | 'material' | 'fit' | 'length' | 'thickness' | 'colorProfile'>;
type DefaultItem = Omit<ClothingItem, keyof AestheticFields | 'imageId' | 'imageThumb' | 'imageAlt'> &
  Partial<AestheticFields>;

const profileFor = (color: string): ColorProfile => {
  const neutral = ['white', 'black', 'gray', 'beige', 'brown', 'denim', 'navy', 'khaki'].includes(color);
  const cool = ['denim', 'navy', 'green', 'mint', 'skyblue', 'blue'].includes(color);
  const warm = ['beige', 'brown', 'pink', 'rose', 'red', 'coral', 'yellow'].includes(color);
  const brightness: Record<string, Rating> = {
    white: 5,
    beige: 4,
    gray: 3,
    denim: 3,
    brown: 2,
    black: 1,
    multi: 4,
  };
  const saturation: Record<string, Rating> = {
    white: 1,
    black: 1,
    gray: 1,
    beige: 1,
    brown: 2,
    denim: 2,
    multi: 5,
  };
  return {
    mainColor: color,
    secondaryColors: color === 'multi' ? ['pink', 'green', 'white'] : [],
    neutralLevel: (neutral ? 5 : color === 'multi' ? 1 : 2) as Rating,
    brightness: brightness[color] ?? 3,
    saturation: saturation[color] ?? 3,
    temperature: neutral ? 'neutral' : cool ? 'cool' : warm ? 'warm' : 'neutral',
  };
};

const materialFor = (item: DefaultItem): Material => {
  if (item.name.includes('牛仔')) return 'denim';
  if (item.name.includes('针织') || item.name.includes('开衫') || item.name.includes('卫衣')) return 'knit';
  if (item.name.includes('大衣')) return 'wool';
  if (item.name.includes('碎花')) return 'chiffon';
  if (item.category === 'shoes' || item.category === 'bag') return 'leather';
  if (item.category === 'accessory') return 'other';
  return 'cotton';
};

const fitFor = (item: DefaultItem): Fit => {
  if (item.name.includes('卫衣') || item.name.includes('大衣')) return 'loose';
  if (item.tags.includes('slimming')) return 'slim';
  return 'regular';
};

const lengthFor = (item: DefaultItem): GarmentLength => {
  if (item.name.includes('大衣') || item.tags.includes('longHem')) return 'long';
  if (item.name.includes('短款')) return 'cropped';
  return 'regular';
};

const patternFor = (item: DefaultItem): Pattern => {
  if (item.color === 'multi') return 'floral';
  return 'solid';
};

const complete = (item: DefaultItem): ClothingItem => ({
  pattern: patternFor(item),
  material: materialFor(item),
  fit: fitFor(item),
  length: lengthFor(item),
  thickness: item.warmth,
  colorProfile: profileFor(item.color),
  ...item,
});

const rawDefaultClothing: DefaultItem[] = [
  {
    id: 'cloth-white-tee',
    name: '白色短袖',
    category: 'top',
    color: 'white',
    styleTags: ['korean', 'minimal'],
    warmth: 2,
    comfort: 5,
    formality: 2,
    versatility: 5,
    suitableSeasons: ['spring', 'summer'],
    suitableOccasions: ['casual', 'class', 'date', 'photo', 'commute'],
    isClean: true,
    tags: ['breathable', 'photoFriendly'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-black-knit',
    name: '黑色针织上衣',
    category: 'top',
    color: 'black',
    styleTags: ['minimal', 'gentle'],
    warmth: 3,
    comfort: 4,
    formality: 3,
    versatility: 5,
    suitableSeasons: ['spring', 'autumn', 'winter'],
    suitableOccasions: ['commute', 'date', 'class', 'casual', 'interview'],
    isClean: true,
    tags: ['slimming'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-white-shirt',
    name: '白色衬衫',
    category: 'top',
    color: 'white',
    styleTags: ['commute', 'minimal', 'preppy'],
    warmth: 2,
    comfort: 3,
    formality: 4,
    versatility: 5,
    suitableSeasons: ['spring', 'summer', 'autumn'],
    suitableOccasions: ['commute', 'interview', 'class', 'date'],
    isClean: true,
    tags: [],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-gray-hoodie',
    name: '灰色卫衣',
    category: 'top',
    color: 'gray',
    styleTags: ['sporty', 'minimal'],
    warmth: 4,
    comfort: 5,
    formality: 1,
    versatility: 4,
    suitableSeasons: ['spring', 'autumn', 'winter'],
    suitableOccasions: ['home', 'class', 'sport', 'casual'],
    isClean: true,
    tags: ['walkComfy', 'coldFriendly'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-blue-jeans',
    name: '浅蓝牛仔裤',
    category: 'bottom',
    color: 'denim',
    styleTags: ['korean', 'minimal'],
    warmth: 3,
    comfort: 4,
    formality: 2,
    versatility: 5,
    suitableSeasons: ['spring', 'summer', 'autumn', 'winter'],
    suitableOccasions: ['casual', 'class', 'commute', 'date'],
    isClean: true,
    tags: ['slimming'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-black-skirt',
    name: '黑色半裙',
    category: 'bottom',
    color: 'black',
    styleTags: ['commute', 'minimal'],
    warmth: 2,
    comfort: 3,
    formality: 3,
    versatility: 4,
    suitableSeasons: ['spring', 'summer', 'autumn'],
    suitableOccasions: ['commute', 'date', 'interview', 'photo', 'class'],
    isClean: true,
    tags: ['slimming'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-floral-dress',
    name: '碎花连衣裙',
    category: 'dress',
    color: 'multi',
    styleTags: ['gentle', 'korean'],
    warmth: 2,
    comfort: 4,
    formality: 3,
    versatility: 3,
    suitableSeasons: ['spring', 'summer'],
    suitableOccasions: ['date', 'photo', 'casual'],
    isClean: true,
    tags: ['photoFriendly', 'breathable'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-beige-cardigan',
    name: '米色开衫',
    category: 'outerwear',
    color: 'beige',
    styleTags: ['gentle', 'korean'],
    warmth: 3,
    comfort: 5,
    formality: 3,
    versatility: 5,
    suitableSeasons: ['spring', 'autumn'],
    suitableOccasions: ['class', 'commute', 'date', 'casual'],
    isClean: true,
    tags: ['coldFriendly'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-black-blazer',
    name: '黑色西装外套',
    category: 'outerwear',
    color: 'black',
    styleTags: ['commute', 'minimal'],
    warmth: 3,
    comfort: 3,
    formality: 5,
    versatility: 4,
    suitableSeasons: ['spring', 'autumn', 'winter'],
    suitableOccasions: ['interview', 'commute', 'date'],
    isClean: true,
    tags: [],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-beige-coat',
    name: '燕麦色大衣',
    category: 'outerwear',
    color: 'beige',
    styleTags: ['minimal', 'commute'],
    warmth: 5,
    comfort: 4,
    formality: 4,
    versatility: 4,
    suitableSeasons: ['autumn', 'winter'],
    suitableOccasions: ['commute', 'date', 'casual', 'interview'],
    isClean: true,
    tags: ['coldFriendly'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-white-sneakers',
    name: '小白鞋',
    category: 'shoes',
    color: 'white',
    styleTags: ['minimal', 'korean'],
    warmth: 2,
    comfort: 5,
    formality: 2,
    versatility: 5,
    suitableSeasons: ['spring', 'summer', 'autumn', 'winter'],
    suitableOccasions: ['casual', 'class', 'commute', 'date', 'photo'],
    isClean: true,
    tags: ['walkComfy'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-black-loafers',
    name: '黑色乐福鞋',
    category: 'shoes',
    color: 'black',
    styleTags: ['commute', 'preppy'],
    warmth: 2,
    comfort: 3,
    formality: 4,
    versatility: 4,
    suitableSeasons: ['spring', 'autumn', 'winter'],
    suitableOccasions: ['commute', 'interview', 'class', 'date'],
    isClean: true,
    tags: [],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-sport-shoes',
    name: '运动鞋',
    category: 'shoes',
    color: 'gray',
    styleTags: ['sporty'],
    warmth: 2,
    comfort: 5,
    formality: 1,
    versatility: 3,
    suitableSeasons: ['spring', 'summer', 'autumn', 'winter'],
    suitableOccasions: ['sport', 'casual', 'class'],
    isClean: true,
    tags: ['walkComfy'],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-canvas-bag',
    name: '帆布包',
    category: 'bag',
    color: 'beige',
    styleTags: ['japanese', 'minimal'],
    warmth: 1,
    comfort: 5,
    formality: 2,
    versatility: 5,
    suitableSeasons: ['spring', 'summer', 'autumn', 'winter'],
    suitableOccasions: ['casual', 'class', 'commute'],
    isClean: true,
    tags: [],
    createdAt: t(),
    updatedAt: t(),
  },
  {
    id: 'cloth-silver-necklace',
    name: '银色项链',
    category: 'accessory',
    color: 'gray',
    styleTags: ['minimal'],
    warmth: 1,
    comfort: 5,
    formality: 3,
    versatility: 4,
    suitableSeasons: ['spring', 'summer', 'autumn', 'winter'],
    suitableOccasions: ['date', 'photo', 'commute', 'interview'],
    isClean: true,
    tags: ['photoFriendly'],
    createdAt: t(),
    updatedAt: t(),
  },
];

export const defaultClothing: ClothingItem[] = rawDefaultClothing.map(complete);
