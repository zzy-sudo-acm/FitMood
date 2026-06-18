import { ClothingItem, OutfitBreakdownPart, OutfitInput } from '../types';

const uniq = <T>(values: T[]) => Array.from(new Set(values));

const hasWaistCue = (items: ClothingItem[]) =>
  items.some(
    (item) =>
      item.length === 'cropped' ||
      item.tags.includes('slimming') ||
      item.tags.includes('highWaist') ||
      item.fit === 'slim'
  );

export const evaluateSilhouette = (items: ClothingItem[], input: OutfitInput): OutfitBreakdownPart => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  const top = items.find((item) => item.category === 'top');
  const bottom = items.find((item) => item.category === 'bottom');
  const dress = items.find((item) => item.category === 'dress');
  const outer = items.find((item) => item.category === 'outerwear');
  const shoes = items.find((item) => item.category === 'shoes');

  if (top && bottom && top.length === 'cropped' && bottom.length !== 'cropped') {
    score += 12;
    reasons.push('短款上衣配下装能把视觉重心往上提，比例会更轻盈。');
  }

  if (top && bottom && (top.fit === 'loose' || top.fit === 'oversized') && bottom.fit === 'slim') {
    score += 9;
    reasons.push('上松下紧有松弛感，也不会压身高。');
  }

  if (top && bottom && top.fit === 'slim' && (bottom.fit === 'loose' || bottom.fit === 'regular')) {
    score += 8;
    reasons.push('上紧下松能留出腰线，整体更显利落。');
  }

  if (outer && top && (outer.fit === 'loose' || outer.fit === 'oversized') && top.fit === 'slim') {
    score += 6;
    reasons.push('外松内紧会让层次更清楚。');
  }

  if (dress && outer && outer.length !== 'long') {
    score += 8;
    reasons.push('连衣裙配短外套，腰线更容易出来。');
  }

  if (
    top &&
    bottom &&
    (top.fit === 'loose' || top.fit === 'oversized') &&
    (bottom.fit === 'loose' || bottom.fit === 'oversized') &&
    !hasWaistCue(items)
  ) {
    score -= 12;
    warnings.push('上装和下装都偏宽松，又没有明显腰线，可能会显得松散。');
  }

  if (outer?.length === 'long' && dress?.length === 'long') {
    if (input.occasion === 'photo' && shoes && shoes.formality >= 3) {
      score += 3;
      reasons.push('长外套叠长裙更有氛围，拍照场景可以成立。');
    } else {
      score -= 4;
      warnings.push('长外套配长裙会比较压比例，可以靠鞋子或腰线拉回来。');
    }
  }

  if (input.activity === 'walking') {
    const riskyLong = items.find(
      (item) => (item.category === 'bottom' || item.category === 'dress') && (item.length === 'long' || item.tags.includes('longHem'))
    );
    if (riskyLong) {
      score -= 7;
      warnings.push('今天走路多，过长的下摆可能会拖累行动。');
    }
    const tightBottom = bottom?.fit === 'slim' && bottom.comfort <= 2;
    if (tightBottom) {
      score -= 5;
      warnings.push('下装偏紧又要走很多路，舒适度会打折。');
    }
  }

  return { score: Math.round(score), reasons: uniq(reasons), warnings: uniq(warnings) };
};
