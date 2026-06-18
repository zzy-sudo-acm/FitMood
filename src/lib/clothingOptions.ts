// 所有显示文案、选项列表集中在这里。存储与推荐逻辑只认 id。
import {
  Activity,
  Category,
  ColdTolerance,
  Feedback,
  Mood,
  Occasion,
  RecommendPreference,
  Season,
  StyleTag,
  TabKey,
  TempFeel,
  Weather,
} from '../types';

// ---- 分类 ----
export const categoryLabels: Record<Category, string> = {
  top: '上装',
  bottom: '下装',
  dress: '连衣裙',
  outerwear: '外套',
  shoes: '鞋子',
  bag: '包包',
  accessory: '配饰',
};

export const categoryOptions: Category[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'];

/** 衣橱筛选用的顺序（含「全部」由页面自己加）。 */
export const categoryOrder = categoryOptions;

// ---- 颜色 ----
export type ColorFamily = 'neutral' | 'warm' | 'cool' | 'purple' | 'pattern';

export interface ColorDef {
  id: string;
  label: string;
  hex: string;
  family: ColorFamily;
  /** 中和色：黑白灰、米色、咖色、牛仔蓝、卡其、藏蓝。不计入「大面积颜色数量」。 */
  neutral: boolean;
  /** 印花 / 撞色单品，参与「花纹最多一件」规则。 */
  pattern?: boolean;
}

export const colorOptions: ColorDef[] = [
  { id: 'white', label: '白色', hex: '#f6f2ec', family: 'neutral', neutral: true },
  { id: 'black', label: '黑色', hex: '#2f2c2a', family: 'neutral', neutral: true },
  { id: 'gray', label: '灰色', hex: '#9b9890', family: 'neutral', neutral: true },
  { id: 'beige', label: '米色', hex: '#e3d4be', family: 'neutral', neutral: true },
  { id: 'brown', label: '咖色', hex: '#8a6a4f', family: 'neutral', neutral: true },
  { id: 'denim', label: '牛仔蓝', hex: '#7088a7', family: 'neutral', neutral: true },
  { id: 'navy', label: '藏蓝', hex: '#39435d', family: 'neutral', neutral: true },
  { id: 'khaki', label: '卡其', hex: '#b3a17a', family: 'neutral', neutral: true },
  { id: 'pink', label: '粉色', hex: '#eec1cd', family: 'warm', neutral: false },
  { id: 'rose', label: '玫红', hex: '#cf6f86', family: 'warm', neutral: false },
  { id: 'red', label: '红色', hex: '#c75b54', family: 'warm', neutral: false },
  { id: 'coral', label: '珊瑚橘', hex: '#e58a6b', family: 'warm', neutral: false },
  { id: 'yellow', label: '鹅黄', hex: '#ecca6b', family: 'warm', neutral: false },
  { id: 'green', label: '绿色', hex: '#84a980', family: 'cool', neutral: false },
  { id: 'mint', label: '薄荷绿', hex: '#a7d3c0', family: 'cool', neutral: false },
  { id: 'skyblue', label: '雾蓝', hex: '#a9c4d6', family: 'cool', neutral: false },
  { id: 'blue', label: '蓝色', hex: '#6f9fc9', family: 'cool', neutral: false },
  { id: 'purple', label: '紫色', hex: '#9d86bf', family: 'purple', neutral: false },
  { id: 'lavender', label: '藕荷', hex: '#c6b6d8', family: 'purple', neutral: false },
  { id: 'multi', label: '印花/撞色', hex: '#d8b6c2', family: 'pattern', neutral: false, pattern: true },
];

const colorMap = new Map(colorOptions.map((c) => [c.id, c]));
export const getColor = (id: string): ColorDef =>
  colorMap.get(id) ?? { id, label: id || '未知色', hex: '#cfcabf', family: 'neutral', neutral: true };
export const colorLabel = (id: string) => getColor(id).label;
export const colorHex = (id: string) => getColor(id).hex;

// ---- 风格标签 ----
export const styleTagLabels: Record<StyleTag, string> = {
  gentle: '温柔',
  sweetCool: '甜酷',
  commute: '通勤',
  preppy: '学院',
  sporty: '运动',
  minimal: '极简',
  hotgirl: '辣妹',
  korean: '韩系',
  japanese: '日系',
};

export const styleTagOptions: StyleTag[] = [
  'gentle',
  'sweetCool',
  'commute',
  'preppy',
  'sporty',
  'minimal',
  'hotgirl',
  'korean',
  'japanese',
];

// ---- 实用标签（衣物 tags 字段）----
export const utilityTagLabels: Record<string, string> = {
  slimming: '显瘦',
  hideFlaws: '遮肉',
  photoFriendly: '拍照好看',
  walkComfy: '走路舒服',
  coldFriendly: '怕冷友好',
  notForRain: '不适合雨天',
  breathable: '清爽透气',
  longHem: '偏长拖地',
};

export const utilityTagOptions: string[] = [
  'slimming',
  'hideFlaws',
  'photoFriendly',
  'walkComfy',
  'coldFriendly',
  'notForRain',
  'breathable',
  'longHem',
];

// ---- 今日心情 ----
export const moodLabels: Record<Mood, string> = {
  comfy: '想舒服',
  slim: '想显瘦',
  gentle: '想温柔',
  cool: '想酷一点',
  easy: '不想费脑',
  delicate: '想精致',
  lowkey: '想低调',
  photogenic: '想拍照好看',
};

export const moodOptions: Mood[] = ['comfy', 'slim', 'gentle', 'cool', 'easy', 'delicate', 'lowkey', 'photogenic'];

// ---- 体感 / 天气 / 场合 / 季节 / 行动强度 ----
export const tempFeelLabels: Record<TempFeel, string> = {
  cold: '冷',
  cool: '凉',
  comfortable: '舒适',
  hot: '热',
};
export const tempFeelOptions: TempFeel[] = ['cold', 'cool', 'comfortable', 'hot'];

export const weatherLabels: Record<Weather, string> = {
  sunny: '晴',
  cloudy: '阴',
  rainy: '雨',
  windy: '大风',
};
export const weatherOptions: Weather[] = ['sunny', 'cloudy', 'rainy', 'windy'];

export const occasionLabels: Record<Occasion, string> = {
  class: '上课',
  commute: '通勤',
  date: '约会',
  interview: '面试',
  photo: '拍照',
  sport: '运动',
  home: '宅家',
  casual: '随便出门',
};
export const occasionOptions: Occasion[] = ['class', 'commute', 'date', 'interview', 'photo', 'sport', 'home', 'casual'];

export const seasonLabels: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};
export const seasonOptions: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export const activityLabels: Record<Activity, string> = {
  sitting: '坐着多',
  normal: '正常出门',
  walking: '走路很多',
};
export const activityOptions: Activity[] = ['sitting', 'normal', 'walking'];

// ---- 反馈 ----
export const feedbackLabels: Record<Feedback, string> = {
  like: '喜欢',
  ok: '还行',
  uncomfortable: '不舒服',
  tooCold: '太冷',
  tooHot: '太热',
  wrongOccasion: '不适合场合',
  regret: '踩雷',
  skipped: '跳过',
};

/** 卡片上可点的反馈（不含 skipped，它是系统自动记的）。 */
export const feedbackOptions: Feedback[] = [
  'like',
  'ok',
  'uncomfortable',
  'tooCold',
  'tooHot',
  'wrongOccasion',
  'regret',
];

// ---- 设置 ----
export const coldToleranceLabels: Record<ColdTolerance, string> = {
  coldProne: '怕冷',
  normal: '正常',
  hotProne: '怕热',
};
export const coldToleranceOptions: ColdTolerance[] = ['coldProne', 'normal', 'hotProne'];

export const recommendPreferenceLabels: Record<RecommendPreference, string> = {
  comfy: '舒服优先',
  pretty: '好看优先',
  safe: '不出错优先',
  photo: '拍照优先',
};
export const recommendPreferenceOptions: RecommendPreference[] = ['comfy', 'pretty', 'safe', 'photo'];

// ---- 底部导航 ----
export const tabLabels: Record<TabKey, string> = {
  today: '今日推荐',
  wardrobe: '我的衣橱',
  history: '穿搭历史',
  settings: '设置',
};

// ---- 评分维度（表单用）----
export const ratingMeta: { key: 'warmth' | 'comfort' | 'formality' | 'versatility'; label: string; hint: string }[] = [
  { key: 'warmth', label: '保暖度', hint: '1 很凉快 · 5 很暖' },
  { key: 'comfort', label: '舒适度', hint: '1 有点遭罪 · 5 很舒服' },
  { key: 'formality', label: '正式度', hint: '1 很休闲 · 5 很正式' },
  { key: 'versatility', label: '百搭度', hint: '1 挑搭配 · 5 很好搭' },
];

// ---- 通用 label 查询（id → 文案，未知值原样返回）----
const styleSet = new Set(styleTagOptions);
const moodSet = new Set(moodOptions);

export const styleTagLabel = (id: string) => styleTagLabels[id as StyleTag] ?? id;
export const moodLabel = (id: string) => moodLabels[id as Mood] ?? id;
export const utilityTagLabel = (id: string) => utilityTagLabels[id] ?? id;
export const isStyleTag = (id: string) => styleSet.has(id as StyleTag);
export const isMood = (id: string) => moodSet.has(id as Mood);
