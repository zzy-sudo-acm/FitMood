import { ClothingItem, OutfitBreakdownPart, OutfitInput, StyleTag } from '../types';
import { styleTagLabels } from './clothingOptions';
import { isPatternedItem } from './colorTheory';

const uniq = <T>(values: T[]) => Array.from(new Set(values));

const hasTag = (items: ClothingItem[], tag: StyleTag) => items.some((item) => item.styleTags.includes(tag));

const readable = (tag: StyleTag) => styleTagLabels[tag];

export const evaluateStyleCoherence = (items: ClothingItem[], input: OutfitInput): OutfitBreakdownPart => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  const counts = new Map<StyleTag, number>();
  for (const item of items) {
    for (const tag of item.styleTags) counts.set(tag as StyleTag, (counts.get(tag as StyleTag) ?? 0) + 1);
  }

  const shared = [...counts.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]);
  if (shared.length) {
    score += Math.min(14, shared.length * 6 + shared[0][1]);
    reasons.push(`风格集中在${readable(shared[0][0])}，整套会更像一个完整造型。`);
  }

  if ((hasTag(items, 'gentle') && hasTag(items, 'commute')) || (hasTag(items, 'preppy') && hasTag(items, 'minimal'))) {
    score += 6;
    reasons.push('温柔、通勤或学院感放在一起比较兼容，气质干净。');
  }

  if (hasTag(items, 'sporty') && (input.occasion === 'sport' || input.occasion === 'casual' || input.occasion === 'class')) {
    score += 5;
    reasons.push('运动休闲的单品放在这个场景里很自然。');
  }

  const formalClean = hasTag(items, 'commute') || hasTag(items, 'minimal') || hasTag(items, 'preppy');
  const playful = hasTag(items, 'hotgirl') || hasTag(items, 'sporty');
  if (formalClean && playful) {
    if (input.occasion === 'photo') {
      score += 3;
      reasons.push('正式感和休闲感有一点碰撞，拍照时会更有层次。');
    } else {
      score -= 9;
      warnings.push('正式感和运动/辣妹感同时出现，日常会有点割裂。');
    }
  }

  if (input.occasion === 'interview' && hasTag(items, 'hotgirl')) {
    score -= 20;
    warnings.push('面试场景不适合太辣妹的风格，会削弱专业感。');
  }

  if (input.occasion === 'interview' && hasTag(items, 'sporty')) {
    score -= 12;
    warnings.push('面试里运动感过强，会显得不够正式。');
  }

  const dress = items.find((item) => item.category === 'dress');
  const shoes = items.find((item) => item.category === 'shoes');
  if (dress && isPatternedItem(dress) && shoes?.styleTags.includes('sporty')) {
    if (input.occasion === 'photo') {
      score += 2;
      reasons.push('碎花和运动鞋是有意混搭，拍照会更轻松。');
    } else {
      score -= 7;
      warnings.push('甜美碎花配强运动鞋会有点跳，换更轻巧的鞋会更顺。');
    }
  }

  return { score: Math.round(score), reasons: uniq(reasons), warnings: uniq(warnings) };
};
