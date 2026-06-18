// 推荐引擎：规则打分，不接 AI。三步走——硬过滤、生成候选整套、整套打分。
import {
  Category,
  ClothingItem,
  Occasion,
  OutfitHistory,
  OutfitInput,
  OutfitRecommendation,
  RecommendResult,
  ScoredOutfit,
  Season,
  Settings,
  StyleTag,
  TempFeel,
} from '../types';
import {
  colorHarmonyScore,
  formalityScore,
  moodPreferredStyles,
  moodPreferredTags,
  occasionMeta,
  proportionScore,
  styleHarmonyScore,
  upperLayers,
  warmthFitScore,
  warmthIndex,
  weatherFitScore,
} from './outfitRules';
import { categoryLabels } from './clothingOptions';

const dayMs = 24 * 60 * 60 * 1000;
const LARGE: Category[] = ['top', 'bottom', 'dress', 'outerwear'];
const Lz = (c: Category) => LARGE.includes(c);
const uniq = <T>(arr: T[]) => Array.from(new Set(arr));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

const seasonsFor = (t: TempFeel): Season[] =>
  t === 'hot'
    ? ['summer']
    : t === 'cold'
      ? ['winter']
      : t === 'cool'
        ? ['autumn', 'spring']
        : ['spring', 'autumn', 'summer'];

// ---------- 第一步：硬过滤 ----------

/** 这件衣服今天能不能进候选池。返回 false 表示直接排除。 */
const isUsable = (item: ClothingItem, input: OutfitInput): boolean => {
  if (!item.isClean) return false;

  // 雨天：不适合雨天的鞋直接拿掉。
  if (input.weather === 'rainy' && item.category === 'shoes' && item.tags.includes('notForRain')) return false;

  // 面试：太辣妹 / 太休闲不进面试候选。
  if (input.occasion === 'interview') {
    if (item.styleTags.includes('hotgirl')) return false;
    if (Lz(item.category) && item.formality <= 1) return false;
  }

  // 运动：不舒服的鞋不进候选。
  if (input.occasion === 'sport' && item.category === 'shoes' && item.comfort <= 2) return false;

  // 大热天：厚外套不进候选（避免一上来就给你套棉服）。
  if (input.tempFeel === 'hot' && item.category === 'outerwear' && item.warmth >= 4) return false;

  return true;
};

// ---------- 历史：最近穿过 & 反馈 ----------

const recentlyWornIds = (history: OutfitHistory[], now: number, withinDays: number) => {
  const set = new Set<string>();
  for (const h of history) {
    if (!h) continue;
    if (h.feedback === 'skipped') continue;
    const items = Array.isArray(h.items) ? h.items : [];
    if ((now - h.createdAt) / dayMs <= withinDays) items.forEach((i) => set.add(i.id));
  }
  return set;
};

const itemFeedbackScore = (history: OutfitHistory[], itemId: string, now: number) => {
  let positive = 0;
  let negative = 0;
  for (const h of history) {
    if (!h || !h.feedback || h.feedback === 'skipped') continue;
    if (!Array.isArray(h.items) || !h.items.some((i) => i.id === itemId)) continue;
    const days = (now - h.createdAt) / dayMs;
    const decay = days <= 7 ? 1 : days <= 30 ? 0.6 : 0.3;
    if (h.feedback === 'like') positive += 5 * decay;
    else if (h.feedback === 'ok') positive += 1 * decay;
    else if (h.feedback === 'regret') negative += 8 * decay;
    else if (h.feedback === 'uncomfortable' || h.feedback === 'wrongOccasion') negative += 5 * decay;
  }
  return Math.round(Math.min(positive, 16) - Math.min(negative, 28));
};

// ---------- 第二步：候选生成 ----------

/** 给单品打个粗分，用来在组合前给每个分类留下最有戏的几件，控制组合数量。 */
const baseItemScore = (item: ClothingItem, input: OutfitInput, settings: Settings): number => {
  let s = item.versatility;
  const meta = occasionMeta[input.occasion];
  if (item.suitableOccasions.includes(input.occasion)) s += 6;
  const seasons = seasonsFor(input.tempFeel);
  if (item.suitableSeasons.some((x) => seasons.includes(x))) s += 4;

  const wantStyles = uniq<StyleTag>([
    ...meta.preferredStyles,
    ...input.moods.flatMap((m) => moodPreferredStyles[m]),
    ...(settings.stylePreference as StyleTag[]),
  ]);
  if (item.styleTags.some((t) => wantStyles.includes(t as StyleTag))) s += 4;
  if (item.styleTags.some((t) => meta.penalizedStyles.includes(t as StyleTag))) s -= 6;

  const wantTags = uniq(input.moods.flatMap((m) => moodPreferredTags[m]));
  if (item.tags.some((t) => wantTags.includes(t))) s += 3;
  return s;
};

const byCategory = (items: ClothingItem[], category: Category) => items.filter((i) => i.category === category);

const topN = (items: ClothingItem[], input: OutfitInput, settings: Settings, n: number) =>
  [...items].sort((a, b) => baseItemScore(b, input, settings) - baseItemScore(a, input, settings)).slice(0, n);

// ---------- 第三步：整套打分 ----------

const scoreOutfit = (
  items: ClothingItem[],
  input: OutfitInput,
  settings: Settings,
  history: OutfitHistory[],
  now: number
): ScoredOutfit => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const breakdown: Record<string, number> = {};
  const meta = occasionMeta[input.occasion];

  const add = (key: string, value: number) => {
    breakdown[key] = (breakdown[key] ?? 0) + value;
  };

  // 天气 / 保暖
  const warm = warmthFitScore(items, input.tempFeel, settings.coldTolerance);
  add('warmth', warm.score);
  reasons.push(...warm.reasons);
  warnings.push(...warm.warnings);

  const weather = weatherFitScore(items, input.weather);
  add('weather', weather.score);
  reasons.push(...weather.reasons);
  warnings.push(...weather.warnings);

  // 热天叠太多层
  if (input.tempFeel === 'hot' && upperLayers(items) >= 2) {
    add('weather', -10);
    warnings.push('热天层次有点多，单层会更舒服');
  }

  // 场合：正式度 + 适配
  const formal = formalityScore(items, input.occasion);
  add('formality', formal.score);
  warnings.push(...formal.warnings);

  const occHits = items.filter((i) => i.suitableOccasions.includes(input.occasion)).length;
  add('occasion', Math.min(12, occHits * 4));
  if (occHits >= 2) reasons.push(`适合${occasionLabel(input.occasion)}`);

  const styleHits = items.filter((i) => i.styleTags.some((t) => meta.preferredStyles.includes(t as StyleTag))).length;
  add('occasion', Math.min(8, styleHits * 3));
  const stylePenalty = items.filter((i) => i.styleTags.some((t) => meta.penalizedStyles.includes(t as StyleTag))).length;
  if (stylePenalty) {
    add('occasion', -stylePenalty * 6);
    warnings.push(`风格不太贴合${occasionLabel(input.occasion)}`);
  }

  // 风格统一 + 色彩 + 比例
  const style = styleHarmonyScore(items);
  add('style', style.score);
  reasons.push(...style.reasons);
  warnings.push(...style.warnings);

  const color = colorHarmonyScore(items);
  add('color', color.score);
  reasons.push(...color.reasons);
  warnings.push(...color.warnings);

  const proportion = proportionScore(items);
  add('proportion', proportion.score);
  reasons.push(...proportion.reasons);

  // 舒适度（含行动强度）
  const comfortAvg = avg(items.map((i) => i.comfort));
  add('comfort', Math.round((comfortAvg - 3) * 4 * meta.comfortWeight));
  const shoes = items.find((i) => i.category === 'shoes');
  if (input.activity === 'walking') {
    if (shoes && shoes.comfort <= 2) {
      add('comfort', -14);
      warnings.push('今天走得多，这双鞋可能会累脚');
    } else if (shoes && (shoes.comfort >= 4 || shoes.tags.includes('walkComfy'))) {
      add('comfort', 8);
      reasons.push('鞋子走路友好');
    }
    if (comfortAvg >= 4) reasons.push('整体好活动');
  }

  // 心情
  const moodStyles = uniq<StyleTag>(input.moods.flatMap((m) => moodPreferredStyles[m]));
  const moodTags = uniq(input.moods.flatMap((m) => moodPreferredTags[m]));
  const moodStyleHits = items.filter((i) => i.styleTags.some((t) => moodStyles.includes(t as StyleTag))).length;
  const moodTagHits = items.filter((i) => i.tags.some((t) => moodTags.includes(t))).length;
  add('mood', Math.min(12, moodStyleHits * 4 + moodTagHits * 3));
  if (input.moods.includes('slim') && items.some((i) => i.tags.includes('slimming'))) reasons.push('有显瘦单品，照顾到你想显瘦');
  if (input.moods.includes('comfy') && comfortAvg >= 4) reasons.push('主打一个舒服');

  // 百搭稳定
  add('versatility', Math.round((avg(items.map((i) => i.versatility)) - 3) * 3));

  // 亮点 / 精致（约会、拍照、想精致/想拍照）
  const wantHighlight =
    meta.highlight || input.moods.includes('photogenic') || input.moods.includes('delicate');
  if (wantHighlight) {
    const hasHighlight = items.some(
      (i) => i.tags.includes('photoFriendly') || (i.category !== 'shoes' && !isNeutralLike(i))
    );
    if (hasHighlight) {
      add('highlight', 8);
      reasons.push('有个上镜的亮点');
    } else {
      add('highlight', -4);
      warnings.push('整体偏素，想出片可以加个亮色或配饰');
    }
  }

  // 偏好加权
  applyPreference(settings, breakdown, items, comfortAvg, reasons);

  // 最近穿过 → 短期降权
  const recent3 = recentlyWornIds(history, now, 3);
  const recent7 = recentlyWornIds(history, now, 7);
  const wornVeryRecent = items.filter((i) => recent3.has(i.id) || (i.lastWornAt && (now - i.lastWornAt) / dayMs <= 2)).length;
  const wornRecent = items.filter((i) => recent7.has(i.id)).length;
  if (wornVeryRecent) {
    add('recency', -8 * wornVeryRecent);
    warnings.push('其中有刚穿过的，换换花样也行');
  } else if (wornRecent) {
    add('recency', -3 * wornRecent);
  }

  // 历史反馈
  const fb = sum(items.map((i) => itemFeedbackScore(history, i.id, now)));
  add('feedback', Math.max(-24, Math.min(20, fb)));
  if (fb >= 8) reasons.push('这几件你以前评价不错');

  const total = Math.round(sum(Object.values(breakdown)));
  return {
    items,
    score: total,
    reasons: uniq(reasons),
    warnings: uniq(warnings),
    breakdown,
    styleLine: styleLineFor(items, input),
  };
};

const isNeutralLike = (item: ClothingItem) => {
  // 引擎里轻量判断：用 outfitRules 的色彩信息。
  return ['white', 'black', 'gray', 'beige', 'brown', 'denim', 'navy', 'khaki'].includes(item.color);
};

const applyPreference = (
  settings: Settings,
  breakdown: Record<string, number>,
  items: ClothingItem[],
  comfortAvg: number,
  reasons: string[]
) => {
  const pref = settings.recommendPreference;
  if (pref === 'comfy') {
    breakdown.comfort = (breakdown.comfort ?? 0) + Math.round((comfortAvg - 3) * 4);
    if (comfortAvg >= 4) reasons.push('按你「舒服优先」挑的');
  } else if (pref === 'pretty') {
    breakdown.style = (breakdown.style ?? 0) * 1.3;
    breakdown.color = (breakdown.color ?? 0) * 1.2;
  } else if (pref === 'safe') {
    breakdown.versatility = (breakdown.versatility ?? 0) + 6;
    breakdown.color = (breakdown.color ?? 0) + 4;
  } else if (pref === 'photo') {
    breakdown.highlight = (breakdown.highlight ?? 0) * 1.5 + 4;
  }
};

// ---------- 风格路线文案 ----------

const styleWord: Record<StyleTag, string> = {
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

const styleLineFor = (items: ClothingItem[], input: OutfitInput): string => {
  const count = new Map<StyleTag, number>();
  items.forEach((i) => i.styleTags.forEach((t) => count.set(t as StyleTag, (count.get(t as StyleTag) ?? 0) + 1)));
  const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const clean = warmthIndex(items) <= 6 && items.every((i) => i.formality <= 4);
  const lead = input.moods.includes('cool') ? '酷' : clean ? '清爽' : '';
  const core = top ? styleWord[top] : input.moods.includes('gentle') ? '温柔' : '日常';
  return `${lead}${core}`.slice(0, 6) || '日常';
};

const occasionLabel = (o: Occasion) =>
  ({ class: '上课', commute: '通勤', date: '约会', interview: '面试', photo: '拍照', sport: '运动', home: '宅家', casual: '出门' })[o];

// ---------- 组合枚举 ----------

const buildCores = (pool: Record<Category, ClothingItem[]>): ClothingItem[][] => {
  const cores: ClothingItem[][] = [];
  const { top, bottom, dress, outerwear, shoes } = pool;

  for (const s of shoes) {
    // dress 系列
    for (const d of dress) {
      cores.push([d, s]);
      for (const o of outerwear) cores.push([d, o, s]);
    }
    // top + bottom 系列
    for (const t of top) {
      for (const b of bottom) {
        cores.push([t, b, s]);
        for (const o of outerwear) cores.push([t, b, o, s]);
      }
    }
  }
  return cores;
};

/** 给一套加上最搭的包/配饰（不强加，只在能加分时保留）。 */
const accentVariants = (
  core: ClothingItem[],
  bags: ClothingItem[],
  accessories: ClothingItem[],
  score: (items: ClothingItem[]) => ScoredOutfit
): ScoredOutfit[] => {
  const variants: ScoredOutfit[] = [score(core)];
  const bestBag = bags.map((b) => score([...core, b])).sort((a, b) => b.score - a.score)[0];
  if (bestBag && bestBag.score >= variants[0].score) variants.push(bestBag);
  const withBag = bestBag && bestBag.score >= variants[0].score ? bestBag.items : core;
  const bestAcc = accessories.map((a) => score([...withBag, a])).sort((x, y) => y.score - x.score)[0];
  if (bestAcc && bestAcc.score >= (variants[1]?.score ?? variants[0].score)) variants.push(bestAcc);
  return variants;
};

const pickWeighted = (items: ScoredOutfit[]): ScoredOutfit => {
  if (items.length === 1) return items[0];
  const min = Math.min(...items.map((i) => i.score));
  const weighted = items.map((i) => ({ i, w: Math.max(1, i.score - min + 4) }));
  const total = sum(weighted.map((w) => w.w));
  let roll = Math.random() * total;
  for (const w of weighted) {
    roll -= w.w;
    if (roll <= 0) return w.i;
  }
  return weighted[0].i;
};

const signature = (o: ScoredOutfit) =>
  o.items
    .filter((i) => i.category === 'top' || i.category === 'bottom' || i.category === 'dress')
    .map((i) => i.id)
    .sort()
    .join('|');

// ---------- 文案 ----------

const itemPhrase = (item: ClothingItem) => item.name;

const buildCopy = (main: ScoredOutfit, input: OutfitInput): OutfitRecommendation['copy'] => {
  const names = main.items.map(itemPhrase).join(' + ');
  const styleLine = main.styleLine;
  const title = `今日推荐 · ${styleLine}`;

  const reasonBits = main.reasons.slice(0, 3);
  const reasonTail = reasonBits.length ? `${reasonBits.join('，')}。` : '整体好搭不费脑。';
  const reason = `今天走${styleLine}路线：${names}。${reasonTail}`;

  const warnings = main.warnings.slice(0, 2);

  let matchTone: 'good' | 'ok' | 'risky' = 'ok';
  let matchLabel = '可以一穿';
  if (main.score >= 55 && warnings.length === 0) {
    matchTone = 'good';
    matchLabel = '今天就它了';
  } else if (main.score >= 40) {
    matchTone = 'good';
    matchLabel = '稳稳的';
  } else if (warnings.length >= 2 || main.score < 20) {
    matchTone = 'risky';
    matchLabel = '能穿，但有小风险';
  }

  return { title, styleLine, reason, warnings, matchLabel, matchTone };
};

const swapNote = (main: ScoredOutfit, alt: ScoredOutfit): string => {
  const mainIds = new Set(main.items.map((i) => i.id));
  const changed = alt.items.filter((i) => !mainIds.has(i.id));
  if (!changed.length) return '换个搭法';
  const cats = uniq(changed.map((i) => categoryLabels[i.category]));
  return `换${cats.join('、')}：${changed.map((i) => i.name).join(' + ')}`;
};

// ---------- 入口 ----------

export const recommendOutfit = (
  clothes: ClothingItem[],
  history: OutfitHistory[],
  input: OutfitInput,
  settings: Settings
): RecommendResult => {
  const now = Date.now();
  const usable = clothes.filter((i) => isUsable(i, input));

  if (usable.length === 0) {
    if (clothes.length === 0) {
      return { ok: false, reason: '衣橱还是空的', hint: '先去「我的衣橱」加几件常穿单品吧。' };
    }
    return { ok: false, reason: '今天可穿的单品不太够', hint: '可穿的衣物被「未洗 / 不适合今天」筛掉了，去衣橱补几件或标记为干净。' };
  }

  const pool: Record<Category, ClothingItem[]> = {
    top: topN(byCategory(usable, 'top'), input, settings, 5),
    bottom: topN(byCategory(usable, 'bottom'), input, settings, 5),
    dress: topN(byCategory(usable, 'dress'), input, settings, 4),
    outerwear: topN(byCategory(usable, 'outerwear'), input, settings, 4),
    shoes: topN(byCategory(usable, 'shoes'), input, settings, 5),
    bag: topN(byCategory(usable, 'bag'), input, settings, 3),
    accessory: topN(byCategory(usable, 'accessory'), input, settings, 3),
  };

  // 缺关键品类时给出友好提示：区分「衣橱里没有」「都在待洗」「今天不合适」。
  const rawOf = (c: Category) => clothes.filter((x) => x.category === c);
  const allDirty = (list: ClothingItem[]) => list.length > 0 && list.every((x) => !x.isClean);

  if (pool.shoes.length === 0) {
    const raw = rawOf('shoes');
    if (raw.length === 0)
      return { ok: false, reason: '还缺一双能搭的鞋子', hint: '去衣橱加一双小白鞋或乐福鞋，就能凑出整套啦。' };
    if (allDirty(raw)) return { ok: false, reason: '鞋子都在待洗', hint: '洗一双，或在衣橱里把某双标记成「可穿」。' };
    if (input.weather === 'rainy')
      return { ok: false, reason: '今天下雨，没有合适的鞋', hint: '衣橱里的鞋都标了「不适合雨天」，加一双防水好走的吧。' };
    if (input.occasion === 'sport')
      return { ok: false, reason: '运动场合还缺一双舒服的鞋', hint: '加一双舒适度高一点的运动鞋吧。' };
    return { ok: false, reason: '今天这双脚有点难安排', hint: '现有的鞋今天都不太合适，去衣橱加一双百搭的吧。' };
  }

  const hasUpper = pool.top.length > 0 || pool.dress.length > 0;
  const hasLower = pool.bottom.length > 0 || pool.dress.length > 0;
  if (!hasUpper) {
    const raw = [...rawOf('top'), ...rawOf('dress')];
    if (allDirty(raw)) return { ok: false, reason: '上身的衣服都在待洗', hint: '洗一件，或先把某件标记成「可穿」。' };
    return {
      ok: false,
      reason: raw.length ? '今天没有合适的上身单品' : '还缺能当上身的单品',
      hint: '加一件上衣或连衣裙，整套就立起来了。',
    };
  }
  if (!hasLower) {
    const raw = [...rawOf('bottom'), ...rawOf('dress')];
    if (allDirty(raw)) return { ok: false, reason: '下身的衣服都在待洗', hint: '洗一件，或先把某件标记成「可穿」。' };
    return {
      ok: false,
      reason: raw.length ? '今天没有合适的下身单品' : '还缺能当下身的单品',
      hint: '加一条裤子 / 半裙，或一条连衣裙就行。',
    };
  }

  const cores = buildCores(pool);
  if (cores.length === 0) {
    return { ok: false, reason: '凑不出完整的一套', hint: '上衣 + 下装 + 鞋子，或连衣裙 + 鞋子，先补齐其中一组。' };
  }

  const score = (items: ClothingItem[]) => scoreOutfit(items, input, settings, history, now);

  // 先给 core 排序，取前若干再补包/配饰，控制计算量。
  const scoredCores = cores.map(score).sort((a, b) => b.score - a.score);
  const topCores = scoredCores.slice(0, 10);

  const allVariants: ScoredOutfit[] = [];
  for (const core of topCores) {
    allVariants.push(...accentVariants(core.items, pool.bag, pool.accessory, score));
  }
  allVariants.sort((a, b) => b.score - a.score);

  // 主推：在分数接近的头部里加权随机，保证「换一个」有变化。
  const best = allVariants[0].score;
  const contenders = allVariants.filter((o) => o.score >= best - 10).slice(0, 6);
  const main = pickWeighted(contenders);

  // 备选：和主推「主件不同」的两套。
  const mainSig = signature(main);
  const alternatives: OutfitRecommendation['alternatives'] = [];
  const usedSigs = new Set([mainSig]);
  for (const o of allVariants) {
    if (alternatives.length >= 2) break;
    const sig = signature(o);
    if (usedSigs.has(sig)) continue;
    usedSigs.add(sig);
    alternatives.push({ items: o.items, note: swapNote(main, o) });
  }

  const recommendation: OutfitRecommendation = {
    items: main.items,
    score: main.score,
    copy: buildCopy(main, input),
    alternatives,
    scoredOutfits: allVariants.slice(0, 8),
  };
  return { ok: true, recommendation };
};
