import { ClothingItem, OutfitBreakdownPart, OutfitInput } from '../types';
import { colorLabel, getColor } from './clothingOptions';

const largeArea = ['top', 'bottom', 'dress', 'outerwear'] as const;

const uniq = <T>(values: T[]) => Array.from(new Set(values));

export const isLargeAreaItem = (item: ClothingItem) => largeArea.includes(item.category as (typeof largeArea)[number]);

export const isPatternedItem = (item: ClothingItem) => item.pattern !== 'solid' || Boolean(getColor(item.color).pattern);

export const isNeutralItem = (item: ClothingItem) =>
  item.colorProfile.neutralLevel >= 4 || getColor(item.colorProfile.mainColor).neutral || getColor(item.color).neutral;

const colorName = (id: string) => colorLabel(id);

const familyOf = (item: ClothingItem) => {
  const color = getColor(item.colorProfile.mainColor || item.color);
  return color.family === 'pattern' ? item.colorProfile.temperature : color.family;
};

export const evaluateColorHarmony = (items: ClothingItem[], input: OutfitInput): OutfitBreakdownPart => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  const large = items.filter(isLargeAreaItem);
  const mainColors = uniq(large.map((item) => item.colorProfile.mainColor || item.color));
  const nonNeutral = large.filter((item) => !isNeutralItem(item));
  const neutral = large.filter(isNeutralItem);
  const nonNeutralFamilies = uniq(nonNeutral.map(familyOf));
  const highSaturation = large.filter((item) => item.colorProfile.saturation >= 4);
  const patterned = large.filter(isPatternedItem);
  const temperatures = uniq(nonNeutral.map((item) => item.colorProfile.temperature).filter((value) => value !== 'neutral'));

  if (mainColors.length <= 2) {
    score += 12;
    reasons.push(
      mainColors.length
        ? `这套以${mainColors.map(colorName).join('和')}为主，视觉很干净。`
        : '大面积颜色很克制，整体不会显乱。'
    );
  } else if (mainColors.length === 3) {
    score += 5;
    reasons.push('大面积颜色控制在三种以内，层次有但不杂。');
  } else {
    score -= Math.min(22, (mainColors.length - 3) * 8);
    warnings.push('大面积颜色有点多，容易把注意力切碎。');
  }

  if (neutral.length && nonNeutral.length <= 2) {
    score += 8;
    reasons.push('中性色把彩色压住了，日常穿会更稳。');
  } else if (nonNeutral.length === 0) {
    score += 7;
    reasons.push('全身偏中性色，干净利落，不容易出错。');
  }

  if (nonNeutralFamilies.length === 1 && nonNeutral.length > 0) {
    score += 8;
    reasons.push('彩色部分集中在同一色系，整体更柔和。');
  } else if (nonNeutralFamilies.length === 2 && temperatures.length <= 1) {
    score += 4;
    reasons.push('颜色关系接近邻近色，过渡比较自然。');
  } else if (nonNeutralFamilies.length >= 3) {
    score -= 8;
    warnings.push('彩色主角太多，建议留一个重点色。');
  }

  if (temperatures.includes('warm') && temperatures.includes('cool')) {
    if (input.occasion === 'photo' || input.occasion === 'date') {
      score += 4;
      reasons.push('冷暖对比能制造一点亮点，拍照或约会会更有记忆点。');
    } else if (highSaturation.length >= 2) {
      score -= 6;
      warnings.push('冷暖高饱和颜色同时出现，日常场合会稍微抢眼。');
    }
  }

  if (highSaturation.length >= 2) {
    score -= Math.min(18, highSaturation.length * 7);
    warnings.push('高饱和颜色超过一处，容易显得用力。');
  } else if (highSaturation.length === 1 && neutral.length) {
    score += 5;
    reasons.push('亮色只留一处，其余颜色负责中和。');
  }

  if (patterned.length > 1) {
    score -= 14;
    warnings.push('花纹单品超过一件，互相抢戏。');
  } else if (patterned.length === 1) {
    score += 3;
    reasons.push('花纹只留一件，其他单品能把它托住。');
  }

  return { score: Math.round(score), reasons: uniq(reasons), warnings: uniq(warnings) };
};
