// FitMood / 今天穿什么 — 数据模型
// 所有枚举都用稳定 id 存储，显示文案集中在 lib/clothingOptions.ts 查表。
// 改 label 不会破坏已存进 localStorage 的数据。

export type Category = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'bag' | 'accessory';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type Occasion = 'class' | 'commute' | 'date' | 'interview' | 'photo' | 'sport' | 'home' | 'casual';

/** 衣物风格标签 / 用户默认风格偏好。 */
export type StyleTag =
  | 'gentle'
  | 'sweetCool'
  | 'commute'
  | 'preppy'
  | 'sporty'
  | 'minimal'
  | 'hotgirl'
  | 'korean'
  | 'japanese';

/** 今日心情 / 意图（决定页选择）。 */
export type Mood =
  | 'comfy'
  | 'slim'
  | 'gentle'
  | 'cool'
  | 'easy'
  | 'delicate'
  | 'lowkey'
  | 'photogenic';

export type TempFeel = 'cold' | 'cool' | 'comfortable' | 'hot';
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'windy';
export type Activity = 'sitting' | 'normal' | 'walking';

export type Rating = 1 | 2 | 3 | 4 | 5;

export type Feedback =
  | 'like'
  | 'ok'
  | 'uncomfortable'
  | 'tooCold'
  | 'tooHot'
  | 'wrongOccasion'
  | 'regret'
  | 'skipped';

export type TabKey = 'today' | 'wardrobe' | 'history' | 'settings';

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  /** 颜色 id，见 clothingOptions.colorOptions。 */
  color: string;
  /** 风格标签 id 列表（StyleTag）。 */
  styleTags: string[];
  warmth: Rating;
  comfort: Rating;
  formality: Rating;
  versatility: Rating;
  suitableSeasons: Season[];
  suitableOccasions: Occasion[];
  isClean: boolean;
  /** 其他实用标签 id（显瘦、遮肉、走路舒服…），见 utilityTagOptions。 */
  tags: string[];
  lastWornAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface OutfitInput {
  tempFeel: TempFeel;
  weather: Weather;
  occasion: Occasion;
  moods: Mood[];
  activity: Activity;
}

/** 历史记录里保存的轻量单品引用（即使原衣物被删，历史也读得出）。 */
export interface OutfitItemRef {
  id: string;
  name: string;
  category: Category;
  color: string;
}

export interface OutfitHistory {
  id: string;
  items: OutfitItemRef[];
  input: OutfitInput;
  feedback?: Feedback;
  createdAt: number;
}

// ---- 设置 ----

export type ColdTolerance = 'coldProne' | 'normal' | 'hotProne';
export type RecommendPreference = 'comfy' | 'pretty' | 'safe' | 'photo';

export interface Settings {
  coldTolerance: ColdTolerance;
  /** 默认风格偏好（StyleTag id 列表）。 */
  stylePreference: string[];
  recommendPreference: RecommendPreference;
}

// ---- 推荐引擎 ----

export interface ScoredOutfit {
  items: ClothingItem[];
  score: number;
  reasons: string[];
  warnings: string[];
  /** 各维度得分，开发者模式展示。 */
  breakdown: Record<string, number>;
  /** 这套搭配的风格路线，如「清爽温柔」。 */
  styleLine: string;
}

export interface OutfitCopy {
  title: string;
  styleLine: string;
  reason: string;
  warnings: string[];
  matchLabel: string;
  matchTone: 'good' | 'ok' | 'risky';
}

export interface OutfitRecommendation {
  items: ClothingItem[];
  score: number;
  copy: OutfitCopy;
  alternatives: { items: ClothingItem[]; note: string }[];
  /** 打分靠前的候选，开发者模式查看。 */
  scoredOutfits: ScoredOutfit[];
}

/** 推荐结果：要么成功，要么带着「缺什么」的友好提示。 */
export type RecommendResult =
  | { ok: true; recommendation: OutfitRecommendation }
  | { ok: false; reason: string; hint?: string };
