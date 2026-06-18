import { ClothingItem, ColdTolerance, Occasion, OutfitBreakdownPart, OutfitInput, Settings, StyleTag, TempFeel } from '../types';
import { isNeutralItem, isPatternedItem } from './colorTheory';

export interface OccasionMeta {
  formalityTarget: number;
  preferredStyles: StyleTag[];
  penalizedStyles: StyleTag[];
  comfortWeight: number;
  highlight: boolean;
}

export const occasionMeta: Record<Occasion, OccasionMeta> = {
  class: {
    formalityTarget: 2,
    preferredStyles: ['korean', 'japanese', 'preppy', 'minimal'],
    penalizedStyles: ['hotgirl'],
    comfortWeight: 1.4,
    highlight: false,
  },
  commute: {
    formalityTarget: 3.6,
    preferredStyles: ['commute', 'minimal', 'gentle'],
    penalizedStyles: ['sporty', 'hotgirl'],
    comfortWeight: 1,
    highlight: false,
  },
  date: {
    formalityTarget: 3,
    preferredStyles: ['gentle', 'sweetCool', 'korean'],
    penalizedStyles: ['sporty'],
    comfortWeight: 1,
    highlight: true,
  },
  interview: {
    formalityTarget: 4.4,
    preferredStyles: ['commute', 'minimal'],
    penalizedStyles: ['sporty', 'hotgirl', 'sweetCool'],
    comfortWeight: 0.9,
    highlight: false,
  },
  photo: {
    formalityTarget: 3,
    preferredStyles: ['gentle', 'sweetCool', 'korean', 'japanese'],
    penalizedStyles: [],
    comfortWeight: 0.9,
    highlight: true,
  },
  sport: {
    formalityTarget: 1.4,
    preferredStyles: ['sporty'],
    penalizedStyles: ['commute', 'gentle'],
    comfortWeight: 1.8,
    highlight: false,
  },
  home: {
    formalityTarget: 1.4,
    preferredStyles: ['minimal', 'sporty'],
    penalizedStyles: ['commute'],
    comfortWeight: 1.7,
    highlight: false,
  },
  casual: {
    formalityTarget: 2.4,
    preferredStyles: ['korean', 'japanese', 'minimal', 'gentle'],
    penalizedStyles: [],
    comfortWeight: 1.3,
    highlight: false,
  },
};

const uniq = <T>(values: T[]) => Array.from(new Set(values));
const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const largeArea = ['top', 'bottom', 'dress', 'outerwear'];

const occasionLabel = (o: Occasion) =>
  ({ class: '上课', commute: '通勤', date: '约会', interview: '面试', photo: '拍照', sport: '运动', home: '宅家', casual: '日常出门' })[o];

const warmthIndex = (items: ClothingItem[]) => {
  let sum = 0;
  for (const item of items) {
    if (item.category === 'shoes') sum += item.warmth * 0.3 + item.thickness * 0.2;
    else if (item.category === 'bag' || item.category === 'accessory') sum += 0;
    else sum += item.warmth * 0.65 + item.thickness * 0.55;
  }
  return Math.round(sum * 10) / 10;
};

const tempTarget: Record<TempFeel, { min: number; max: number }> = {
  hot: { min: 2.5, max: 5.5 },
  comfortable: { min: 4.8, max: 8.8 },
  cool: { min: 7, max: 11.5 },
  cold: { min: 10.5, max: 17 },
};

const coldShift: Record<ColdTolerance, number> = { coldProne: 1.4, normal: 0, hotProne: -1.4 };

export const evaluateOccasionFitness = (items: ClothingItem[], input: OutfitInput): OutfitBreakdownPart => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  const meta = occasionMeta[input.occasion];
  const large = items.filter((item) => largeArea.includes(item.category));
  const formalAvg = avg(large.map((item) => item.formality));
  const comfortAvg = avg(items.map((item) => item.comfort));
  const shoes = items.find((item) => item.category === 'shoes');
  const patterned = large.filter(isPatternedItem);
  const highSaturation = large.filter((item) => item.colorProfile.saturation >= 4);
  const styleHits = items.filter((item) => item.styleTags.some((tag) => meta.preferredStyles.includes(tag as StyleTag))).length;
  const stylePenalty = items.filter((item) => item.styleTags.some((tag) => meta.penalizedStyles.includes(tag as StyleTag))).length;

  const formalDiff = Math.abs(formalAvg - meta.formalityTarget);
  if (formalDiff <= 0.8) {
    score += 9;
    reasons.push(`正式度贴合${occasionLabel(input.occasion)}，不会太松也不会太隆重。`);
  } else if (formalAvg < meta.formalityTarget) {
    score -= Math.min(14, (meta.formalityTarget - formalAvg) * 6);
    warnings.push(`${occasionLabel(input.occasion)}场合可以再利落正式一点。`);
  } else {
    score -= Math.min(8, (formalAvg - meta.formalityTarget) * 4);
  }

  if (styleHits >= 2) {
    score += Math.min(10, styleHits * 3);
    reasons.push(`风格和${occasionLabel(input.occasion)}比较贴。`);
  }

  if (stylePenalty) {
    score -= stylePenalty * 7;
    warnings.push(`有单品风格不太贴合${occasionLabel(input.occasion)}。`);
  }

  if (input.occasion === 'interview') {
    if (formalAvg >= 4 && shoes && shoes.formality >= 4) {
      score += 12;
      reasons.push('面试需要的干净、利落和正式感都比较到位。');
    }
    if (!patterned.length && large.every(isNeutralItem)) {
      score += 7;
      reasons.push('低花纹、低饱和的配色更适合面试。');
    }
    if (shoes && shoes.formality <= 2) {
      score -= 18;
      warnings.push('面试建议换更正式的鞋，小白鞋或运动鞋偏休闲。');
    }
    if (patterned.length) {
      score -= 16;
      warnings.push('面试更稳妥的是纯色，大面积花纹会分散专业感。');
    }
    if (highSaturation.length) {
      score -= 8;
      warnings.push('面试不太适合高饱和亮色，低调干净会更稳。');
    }
  }

  if (input.occasion === 'commute' && comfortAvg >= 3.5 && formalAvg >= 3) {
    score += 6;
    reasons.push('通勤需要的利落和舒适都有照顾到。');
  }

  if (input.occasion === 'class' && comfortAvg >= 4) {
    score += 6;
    reasons.push('上课久坐和走动都比较舒服。');
  }

  if (input.occasion === 'date') {
    if (items.some((item) => item.styleTags.includes('gentle')) || items.some((item) => item.category === 'accessory')) {
      score += 7;
      reasons.push('约会场景里有温柔或精致的小细节。');
    }
  }

  if (input.occasion === 'photo') {
    const highlight = items.some((item) => item.tags.includes('photoFriendly') || item.category === 'accessory' || item.colorProfile.saturation >= 4);
    if (highlight) {
      score += 9;
      reasons.push('有适合出片的亮点，镜头里不会太平。');
    } else {
      score -= 5;
      warnings.push('拍照会稍微素一点，可以加配饰或亮点色。');
    }
  }

  if (input.occasion === 'sport') {
    if (shoes && shoes.comfort >= 4 && shoes.styleTags.includes('sporty')) {
      score += 12;
      reasons.push('鞋子和活动量匹配，运动起来更安心。');
    } else {
      score -= 12;
      warnings.push('运动场合需要更舒服、防滑、行动自由的鞋。');
    }
  }

  if (input.occasion === 'home' && comfortAvg >= 4) {
    score += 10;
    reasons.push('宅家舒适优先，这套不会束缚。');
  }

  return { score: Math.round(score), reasons: uniq(reasons), warnings: uniq(warnings) };
};

export const evaluateWeatherComfort = (
  items: ClothingItem[],
  input: OutfitInput,
  settings: Settings
): OutfitBreakdownPart => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  const index = warmthIndex(items);
  const shift = coldShift[settings.coldTolerance];
  const target = { min: tempTarget[input.tempFeel].min + shift, max: tempTarget[input.tempFeel].max + shift };
  const shoes = items.find((item) => item.category === 'shoes');

  if (index < target.min) {
    score -= Math.min(28, (target.min - index) * 7);
    warnings.push(input.tempFeel === 'cold' ? '这套偏薄，今天可能不够暖。' : '保暖稍弱，注意早晚温差。');
  } else if (index > target.max) {
    score -= Math.min(26, (index - target.max) * 6);
    warnings.push(input.tempFeel === 'hot' ? '这套偏厚，热天穿可能会闷。' : '厚度略高，可能会有点热。');
  } else {
    score += 14;
    reasons.push(input.tempFeel === 'hot' ? '厚度清爽，不会太闷。' : input.tempFeel === 'cold' ? '保暖比较到位。' : '厚薄和体感比较匹配。');
  }

  if (input.tempFeel === 'hot') {
    const heavy = items.find(
      (item) =>
        (item.category === 'outerwear' || item.category === 'top') &&
        (item.thickness >= 4 || item.warmth >= 4 || item.material === 'knit' || item.material === 'wool')
    );
    if (heavy) {
      score -= 14;
      warnings.push('热天不太适合厚针织、羊毛或厚外套，容易闷。');
    }
    if (items.some((item) => item.tags.includes('breathable') || item.material === 'linen' || item.material === 'chiffon')) {
      score += 5;
      reasons.push('有透气或轻薄材质，热天更舒服。');
    }
  }

  if (input.weather === 'rainy') {
    if (shoes?.tags.includes('notForRain')) {
      score -= 22;
      warnings.push('这双鞋不适合雨天，容易湿或打滑。');
    } else if (shoes && shoes.material === 'leather') {
      score += 4;
      reasons.push('鞋面相对利落，雨天比帆布材质更安心。');
    }

    const longHem = items.find(
      (item) => (item.category === 'bottom' || item.category === 'dress') && (item.length === 'long' || item.tags.includes('longHem'))
    );
    if (longHem) {
      score -= 8;
      warnings.push('雨天裤摆或裙摆偏长，容易被打湿。');
    }
  }

  if (input.weather === 'windy') {
    const outer = items.find((item) => item.category === 'outerwear');
    if (outer) {
      score += 6;
      reasons.push('有外套挡风，体感会稳一点。');
    } else if (items.some((item) => (item.category === 'top' || item.category === 'dress') && item.thickness <= 2)) {
      score -= 8;
      warnings.push('风大时单穿轻薄单品会有点飘，也可能偏冷。');
    }
  }

  if (input.activity === 'walking') {
    if (shoes && (shoes.comfort >= 4 || shoes.tags.includes('walkComfy'))) {
      score += 8;
      reasons.push('鞋子走路友好，今天活动量大也不太累。');
    } else if (shoes && shoes.comfort <= 2) {
      score -= 16;
      warnings.push('今天走路多，这双鞋可能会累脚。');
    }
  } else if (input.activity === 'sitting' && shoes && shoes.comfort <= 2) {
    score -= 4;
    warnings.push('虽然今天坐着多，但鞋子太不舒服还是会影响状态。');
  }

  return { score: Math.round(score), reasons: uniq(reasons), warnings: uniq(warnings) };
};
