// 审美 & 适配规则的纯函数集合。推荐引擎(outfitRecommend.ts)调用这里，
// 把「为什么好看 / 为什么不合适」拆成可解释的小判断。
import { Category, ClothingItem, ColdTolerance, Mood, Occasion, StyleTag, TempFeel, Weather } from '../types';
import { ColorFamily, getColor } from './clothingOptions';

// 大面积单品：决定整体色彩印象的部位。
export const LARGE_AREA: Category[] = ['top', 'bottom', 'dress', 'outerwear'];

export const isNeutralColor = (colorId: string) => getColor(colorId).neutral;
export const colorFamily = (colorId: string): ColorFamily => getColor(colorId).family;
export const isPatternColor = (colorId: string) => Boolean(getColor(colorId).pattern);
export const isPatternItem = (item: ClothingItem) => isPatternColor(item.color);

const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const has = (item: ClothingItem | undefined, tag: string) => Boolean(item?.tags.includes(tag));

// ---- 色彩 ----

/** 大面积部位用到的不同颜色（id 去重）。 */
export const largeAreaColors = (items: ClothingItem[]) =>
  Array.from(new Set(items.filter((i) => LARGE_AREA.includes(i.category)).map((i) => i.color)));

/** 大面积部位里的「非中和色系」集合，用来判断是否花。 */
export const brightFamilies = (items: ClothingItem[]) =>
  Array.from(
    new Set(
      items
        .filter((i) => LARGE_AREA.includes(i.category))
        .map((i) => getColor(i.color))
        .filter((c) => !c.neutral && c.family !== 'pattern')
        .map((c) => c.family)
    )
  );

export const patternCount = (items: ClothingItem[]) => items.filter(isPatternItem).length;

/**
 * 色彩协调打分：
 * - 大面积颜色 ≤3 干净；超出递减
 * - 非中和色系越少越稳（同色系/中和压住加分）
 * - 花纹最多一件
 */
export const colorHarmonyScore = (items: ClothingItem[]): { score: number; reasons: string[]; warnings: string[] } => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  const distinct = largeAreaColors(items).length;
  if (distinct <= 2) {
    score += 10;
    reasons.push('配色干净');
  } else if (distinct === 3) {
    score += 4;
  } else {
    score -= 8 * (distinct - 3);
    warnings.push('整体颜色偏多，容易显乱');
  }

  const bright = brightFamilies(items);
  if (bright.length === 0) {
    score += 6;
    reasons.push('中和色打底，怎么穿都稳');
  } else if (bright.length === 1) {
    score += 6;
    reasons.push('一个主色调 + 中和色，很协调');
  } else if (bright.length >= 3) {
    score -= 10;
    warnings.push('鲜艳颜色太多，建议留一个主角');
  }

  const patterns = patternCount(items);
  if (patterns >= 2) {
    score -= 12;
    warnings.push('两件以上花纹会打架，留一件就好');
  } else if (patterns === 1) {
    score += 3;
  }

  return { score, reasons, warnings };
};

// ---- 保暖 / 天气 ----

/** 覆盖躯干的部位累加保暖度，鞋子小幅计入。 */
export const warmthIndex = (items: ClothingItem[]) => {
  let sum = 0;
  for (const item of items) {
    if (item.category === 'shoes') sum += item.warmth * 0.3;
    else if (item.category === 'bag' || item.category === 'accessory') sum += 0;
    else sum += item.warmth;
  }
  return Math.round(sum * 10) / 10;
};

/** 上半身叠穿层数（外套 + 上装/连衣裙）。 */
export const upperLayers = (items: ClothingItem[]) =>
  items.filter((i) => i.category === 'top' || i.category === 'dress' || i.category === 'outerwear').length;

const tempTarget: Record<TempFeel, { min: number; max: number }> = {
  hot: { min: 3, max: 6 },
  comfortable: { min: 5, max: 9 },
  cool: { min: 7, max: 11 },
  cold: { min: 10, max: 16 },
};

const coldShift: Record<ColdTolerance, number> = { coldProne: 1.5, normal: 0, hotProne: -1.5 };

export const warmthFitScore = (
  items: ClothingItem[],
  tempFeel: TempFeel,
  coldTolerance: ColdTolerance
): { score: number; reasons: string[]; warnings: string[] } => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const index = warmthIndex(items);
  const shift = coldShift[coldTolerance];
  const target = { min: tempTarget[tempFeel].min + shift, max: tempTarget[tempFeel].max + shift };

  let score = 0;
  if (index < target.min) {
    const gap = target.min - index;
    score -= Math.min(28, gap * 7);
    warnings.push(tempFeel === 'cold' ? '这套偏薄，今天可能不够暖' : '保暖可能稍弱，注意早晚温差');
  } else if (index > target.max) {
    const gap = index - target.max;
    score -= Math.min(24, gap * 5);
    warnings.push(tempFeel === 'hot' ? '这套偏厚，热天穿可能闷' : '可能偏厚了一点');
  } else {
    score += 14;
    reasons.push(tempFeel === 'cold' ? '保暖到位' : tempFeel === 'hot' ? '清爽不闷' : '厚度刚好');
  }
  return { score, reasons, warnings };
};

export const weatherFitScore = (
  items: ClothingItem[],
  weather: Weather
): { score: number; reasons: string[]; warnings: string[] } => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  if (weather === 'rainy') {
    const longBottom = items.find((i) => i.category === 'bottom' && has(i, 'longHem'));
    if (longBottom) {
      score -= 8;
      warnings.push('雨天裤摆/裙摆偏长容易湿');
    }
    const hasOuter = items.some((i) => i.category === 'outerwear');
    if (hasOuter) {
      score += 4;
      reasons.push('有外套，应付小雨更安心');
    }
  }

  if (weather === 'windy') {
    const hasOuter = items.some((i) => i.category === 'outerwear');
    const onlyThinTop = items.some((i) => i.category === 'top' && i.warmth <= 2) && !hasOuter;
    if (hasOuter) {
      score += 6;
      reasons.push('有外套挡风');
    } else if (onlyThinTop) {
      score -= 8;
      warnings.push('风大，单穿薄上衣可能偏冷');
    }
  }

  if (weather === 'sunny') {
    const breathable = items.some((i) => has(i, 'breathable'));
    if (breathable) {
      score += 3;
      reasons.push('清爽透气，晴天舒服');
    }
  }

  return { score, reasons, warnings };
};

// ---- 场合 / 风格 ----

export interface OccasionMeta {
  formalityTarget: number; // 期望平均正式度
  preferredStyles: StyleTag[];
  penalizedStyles: StyleTag[];
  comfortWeight: number; // 舒适度权重倍数
  highlight: boolean; // 是否鼓励亮点/精致
}

export const occasionMeta: Record<Occasion, OccasionMeta> = {
  class: { formalityTarget: 2, preferredStyles: ['korean', 'japanese', 'preppy', 'minimal'], penalizedStyles: ['hotgirl'], comfortWeight: 1.4, highlight: false },
  commute: { formalityTarget: 3.6, preferredStyles: ['commute', 'minimal', 'gentle'], penalizedStyles: ['sporty', 'hotgirl'], comfortWeight: 1, highlight: false },
  date: { formalityTarget: 3, preferredStyles: ['gentle', 'sweetCool', 'korean'], penalizedStyles: ['sporty'], comfortWeight: 1, highlight: true },
  interview: { formalityTarget: 4.4, preferredStyles: ['commute', 'minimal'], penalizedStyles: ['sporty', 'hotgirl', 'sweetCool'], comfortWeight: 0.9, highlight: false },
  photo: { formalityTarget: 3, preferredStyles: ['gentle', 'sweetCool', 'korean', 'japanese'], penalizedStyles: [], comfortWeight: 0.9, highlight: true },
  sport: { formalityTarget: 1.4, preferredStyles: ['sporty'], penalizedStyles: ['commute', 'gentle'], comfortWeight: 1.8, highlight: false },
  home: { formalityTarget: 1.4, preferredStyles: ['minimal', 'sporty'], penalizedStyles: ['commute'], comfortWeight: 1.7, highlight: false },
  casual: { formalityTarget: 2.4, preferredStyles: ['korean', 'japanese', 'minimal', 'gentle'], penalizedStyles: [], comfortWeight: 1.3, highlight: false },
};

/** 风格统一度：单品风格标签的重合程度。 */
export const styleHarmonyScore = (items: ClothingItem[]): { score: number; reasons: string[]; warnings: string[] } => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const count = new Map<string, number>();
  for (const item of items) for (const tag of item.styleTags) count.set(tag, (count.get(tag) ?? 0) + 1);

  const shared = [...count.entries()].filter(([, n]) => n >= 2);
  let score = 0;
  if (shared.length) {
    score += Math.min(12, shared.length * 6);
    reasons.push('风格统一');
  }

  // 通勤/学院 与 辣妹/运动 同时出现容易割裂。
  const tags = new Set(count.keys());
  const cleanCrowd = tags.has('commute') || tags.has('preppy') || tags.has('minimal');
  const playful = tags.has('hotgirl') || tags.has('sporty');
  if (cleanCrowd && playful) {
    score -= 8;
    warnings.push('风格有点跳，气质和随性掺在一起');
  }
  return { score, reasons, warnings };
};

/** 正式度匹配（场合需要多正式）。 */
export const formalityScore = (items: ClothingItem[], occasion: Occasion): { score: number; warnings: string[] } => {
  const warnings: string[] = [];
  const target = occasionMeta[occasion].formalityTarget;
  const actual = avg(items.filter((i) => LARGE_AREA.includes(i.category)).map((i) => i.formality));
  const diff = actual - target;
  let score = 0;
  if (occasion === 'interview' && actual < 3.4) {
    score -= 16;
    warnings.push('面试偏休闲了，建议更正式干净一点');
  } else if (Math.abs(diff) <= 0.8) {
    score += 10;
  } else if (diff < 0) {
    score -= Math.min(12, Math.abs(diff) * 6);
    if (occasion === 'commute') warnings.push('通勤可以再正式一点');
  } else {
    score -= Math.min(8, diff * 4);
    if (occasion === 'home' || occasion === 'sport') warnings.push('比场合需要的更正式，可能略隆重');
  }

  // formalityScore 只看大面积单品，这里单独把「鞋的正式度」和「花纹」补进来——
  // 否则会出现面试搭小白鞋 / 碎花裙这种偏休闲的组合。
  const shoes = items.find((i) => i.category === 'shoes');
  if (shoes) {
    if (occasion === 'interview') {
      if (shoes.formality <= 2) {
        score -= 12;
        warnings.push('面试建议换更正式的鞋，小白鞋/运动鞋偏休闲');
      } else if (shoes.formality >= 4) {
        score += 6;
      }
    } else if (occasion === 'commute' && shoes.formality <= 1) {
      score -= 6;
    }
  }
  if (occasion === 'interview' && patternCount(items) > 0) {
    score -= 8;
    warnings.push('面试更稳妥的是纯色，少一点花纹');
  }

  return { score, warnings };
};

// ---- 比例 / 廓形（用现有字段做的轻量近似）----
export const proportionScore = (items: ClothingItem[]): { score: number; reasons: string[] } => {
  const reasons: string[] = [];
  let score = 0;
  const dress = items.find((i) => i.category === 'dress');
  const outer = items.find((i) => i.category === 'outerwear');
  const top = items.find((i) => i.category === 'top');
  const bottom = items.find((i) => i.category === 'bottom');

  if (dress && outer) {
    score += 4;
    reasons.push('连衣裙叠短外套，腰线更明显');
  }
  if (top && bottom && (top.tags.includes('slimming') || bottom.tags.includes('slimming'))) {
    score += 4;
    reasons.push('有显瘦单品，比例更好看');
  }
  return { score, reasons };
};

// ---- 心情 → 偏好 ----
export const moodPreferredStyles: Record<Mood, StyleTag[]> = {
  comfy: [],
  slim: ['minimal'],
  gentle: ['gentle', 'korean', 'japanese'],
  cool: ['sweetCool', 'hotgirl', 'minimal'],
  easy: ['minimal'],
  delicate: ['gentle', 'korean', 'minimal'],
  lowkey: ['minimal', 'commute'],
  photogenic: ['gentle', 'sweetCool', 'korean'],
};

export const moodPreferredTags: Record<Mood, string[]> = {
  comfy: ['walkComfy'],
  slim: ['slimming', 'hideFlaws'],
  gentle: [],
  cool: [],
  easy: [],
  delicate: ['photoFriendly'],
  lowkey: [],
  photogenic: ['photoFriendly'],
};
