import { describe, expect, it } from 'vitest';
import { recommendOutfit } from '../outfitRecommend';
import { defaultClothing } from '../../data/defaultClothing';
import { largeAreaColors, patternCount, warmthIndex } from '../outfitRules';
import { ClothingItem, OutfitHistory, OutfitInput, Settings } from '../../types';
import { normalizeClothing, normalizeHistory } from '../storage';
import { evaluateColorHarmony } from '../colorTheory';
import { evaluateSilhouette } from '../silhouetteRules';

let idc = 0;
const make = (over: Partial<ClothingItem> = {}): ClothingItem => normalizeClothing({
  id: `id-${idc++}`,
  name: 'item',
  category: 'top',
  color: 'white',
  styleTags: [],
  warmth: 3,
  comfort: 3,
  formality: 3,
  versatility: 3,
  suitableSeasons: ['spring', 'summer', 'autumn', 'winter'],
  suitableOccasions: ['casual', 'class', 'commute', 'date', 'interview', 'photo', 'sport', 'home'],
  isClean: true,
  tags: [],
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

const settings: Settings = { coldTolerance: 'normal', stylePreference: [], recommendPreference: 'safe' };
const input = (over: Partial<OutfitInput> = {}): OutfitInput => ({
  tempFeel: 'comfortable',
  weather: 'sunny',
  occasion: 'casual',
  moods: [],
  activity: 'normal',
  ...over,
});

const hasShoes = (items: ClothingItem[]) => items.some((i) => i.category === 'shoes');
const isCompleteOutfit = (items: ClothingItem[]) => {
  if (!hasShoes(items)) return false;
  const dress = items.some((i) => i.category === 'dress');
  const top = items.some((i) => i.category === 'top');
  const bottom = items.some((i) => i.category === 'bottom');
  return dress || (top && bottom);
};

describe('recommendOutfit — 完整闭环', () => {
  it('默认衣橱能在多种场合给出一整套搭配', () => {
    for (const occasion of ['casual', 'class', 'commute', 'date', 'interview', 'sport', 'photo', 'home'] as const) {
      const result = recommendOutfit(defaultClothing, [], input({ occasion }), settings);
      expect(result.ok, `${occasion} 应能搭配`).toBe(true);
      if (result.ok) {
        expect(isCompleteOutfit(result.recommendation.items), `${occasion} 应是完整一套`).toBe(true);
        expect(result.recommendation.items.every((i) => i.isClean)).toBe(true);
      }
    }
  });

  it('总会给出推荐理由与匹配度文案', () => {
    const result = recommendOutfit(defaultClothing, [], input({ occasion: 'date', moods: ['gentle'] }), settings);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.copy.reason.length).toBeGreaterThan(0);
      expect(result.recommendation.copy.matchLabel.length).toBeGreaterThan(0);
      expect(result.recommendation.copy.styleLine.length).toBeGreaterThan(0);
    }
  });
});

describe('第一步：硬过滤', () => {
  it('不干净的单品不会被推荐', () => {
    const dirty = defaultClothing.map((c) => ({ ...c, isClean: false }));
    const result = recommendOutfit(dirty, [], input(), settings);
    expect(result.ok).toBe(false);
  });

  it('雨天不推荐标了「不适合雨天」的鞋', () => {
    const wardrobe = [
      make({ category: 'top', color: 'white' }),
      make({ category: 'bottom', color: 'denim' }),
      make({ id: 'rain-bad', category: 'shoes', tags: ['notForRain'] }),
      make({ id: 'rain-ok', category: 'shoes', tags: ['walkComfy'] }),
    ];
    const result = recommendOutfit(wardrobe, [], input({ weather: 'rainy' }), settings);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const shoes = result.recommendation.items.find((i) => i.category === 'shoes');
      expect(shoes?.id).toBe('rain-ok');
    }
  });

  it('面试不推荐辣妹风单品', () => {
    const wardrobe = [
      make({ id: 'hot', category: 'top', styleTags: ['hotgirl'] }),
      make({ id: 'shirt', category: 'top', styleTags: ['commute'], formality: 4 }),
      make({ category: 'bottom', color: 'black', formality: 4 }),
      make({ category: 'shoes', color: 'black', formality: 4 }),
    ];
    const result = recommendOutfit(wardrobe, [], input({ occasion: 'interview' }), settings);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.items.some((i) => i.styleTags.includes('hotgirl'))).toBe(false);
    }
  });

  it('运动场合不推荐不舒服的鞋', () => {
    const wardrobe = [
      make({ category: 'top', styleTags: ['sporty'] }),
      make({ category: 'bottom' }),
      make({ id: 'stiff', category: 'shoes', comfort: 1 }),
      make({ id: 'comfy', category: 'shoes', comfort: 5, tags: ['walkComfy'] }),
    ];
    const result = recommendOutfit(wardrobe, [], input({ occasion: 'sport', activity: 'walking' }), settings);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.items.find((i) => i.category === 'shoes')?.id).toBe('comfy');
    }
  });
});

describe('缺单品时的友好提示', () => {
  it('空衣橱提示去添加', () => {
    const result = recommendOutfit([], [], input(), settings);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('空');
  });

  it('没有鞋子时明确提示缺鞋', () => {
    const wardrobe = [make({ category: 'top' }), make({ category: 'bottom' })];
    const result = recommendOutfit(wardrobe, [], input(), settings);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('鞋');
  });

  it('只有鞋子时提示缺上身/下身', () => {
    const wardrobe = [make({ category: 'shoes' })];
    const result = recommendOutfit(wardrobe, [], input(), settings);
    expect(result.ok).toBe(false);
  });
});

describe('outfitRules 纯函数', () => {
  it('warmthIndex：外套叠加更暖', () => {
    const thin = [make({ category: 'top', warmth: 2 }), make({ category: 'bottom', warmth: 2 })];
    const thick = [...thin, make({ category: 'outerwear', warmth: 5 })];
    expect(warmthIndex(thick)).toBeGreaterThan(warmthIndex(thin));
  });

  it('largeAreaColors / patternCount 统计正确', () => {
    const items = [
      make({ category: 'top', color: 'white' }),
      make({ category: 'bottom', color: 'denim' }),
      make({ category: 'dress', color: 'multi' }),
    ];
    expect(largeAreaColors(items).sort()).toEqual(['denim', 'multi', 'white']);
    expect(patternCount(items)).toBe(1);
  });
});


describe('第三步：避免明显不合理的搭配', () => {
  it('面试场合不会推荐低正式鞋 + 花纹裙的组合', () => {
    const wardrobe = [
      make({ id: 'shirt', category: 'top', name: '白衬衫', color: 'white', styleTags: ['commute'], formality: 5 }),
      make({ id: 'skirt', category: 'bottom', name: '黑色半裙', color: 'black', styleTags: ['commute'], formality: 4 }),
      make({ id: 'floral', category: 'dress', name: '碎花裙', color: 'multi', pattern: 'floral', formality: 4 }),
      make({ id: 'casual-shoe', category: 'shoes', name: '休闲鞋', formality: 1 }),
      make({ id: 'formal-shoe', category: 'shoes', name: '乐福鞋', color: 'black', styleTags: ['commute'], formality: 4 }),
    ];
    const r = recommendOutfit(wardrobe, [], input({ occasion: 'interview' }), settings);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const ids = r.recommendation.items.map((item) => item.id);
      expect(ids).not.toContain('floral');
      expect(ids).not.toContain('casual-shoe');
    }
  });

  it('热天不推荐厚外套', () => {
    const wardrobe = [
      make({ category: 'top', warmth: 2 }),
      make({ category: 'bottom', warmth: 2 }),
      make({ id: 'coat', category: 'outerwear', warmth: 5, name: '厚大衣' }),
      make({ category: 'shoes' }),
    ];
    const r = recommendOutfit(wardrobe, [], input({ tempFeel: 'hot', weather: 'sunny' }), settings);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.recommendation.items.some((i) => i.id === 'coat')).toBe(false);
  });
});

describe('v0.3 审美规则引擎', () => {
  it('高饱和颜色过多会扣分', () => {
    const calm = [
      make({ category: 'top', color: 'white' }),
      make({ category: 'bottom', color: 'denim' }),
      make({ category: 'outerwear', color: 'beige' }),
    ];
    const loud = [
      make({ category: 'top', color: 'red' }),
      make({ category: 'bottom', color: 'yellow' }),
      make({ category: 'outerwear', color: 'blue' }),
    ];
    expect(evaluateColorHarmony(loud, input()).score).toBeLessThan(evaluateColorHarmony(calm, input()).score);
    expect(evaluateColorHarmony(loud, input()).warnings.join('')).toContain('高饱和');
  });

  it('同色系或中性色平衡会加分', () => {
    const outfit = [
      make({ category: 'top', color: 'white' }),
      make({ category: 'bottom', color: 'beige' }),
      make({ category: 'outerwear', color: 'brown' }),
    ];
    const result = evaluateColorHarmony(outfit, input());
    expect(result.score).toBeGreaterThan(10);
    expect(result.reasons.join('')).toContain('中性');
  });

  it('上短下长会加分', () => {
    const result = evaluateSilhouette(
      [
        make({ category: 'top', length: 'cropped' }),
        make({ category: 'bottom', length: 'long', fit: 'regular' }),
      ],
      input()
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.join('')).toContain('视觉重心');
  });

  it('宽松上衣 + 宽松下装且没有腰线会扣分', () => {
    const result = evaluateSilhouette(
      [
        make({ category: 'top', fit: 'loose', length: 'regular', tags: [] }),
        make({ category: 'bottom', fit: 'loose', length: 'regular', tags: [] }),
      ],
      input()
    );
    expect(result.score).toBeLessThan(0);
    expect(result.warnings.join('')).toContain('没有明显腰线');
  });
});

describe('边界：缺单品 / 待洗 / 天气不合适都给温柔提示', () => {
  it('雨天所有鞋都不适合雨天 → 提示而非崩溃', () => {
    const wardrobe = [make({ category: 'top' }), make({ category: 'bottom' }), make({ category: 'shoes', tags: ['notForRain'] })];
    const r = recommendOutfit(wardrobe, [], input({ weather: 'rainy' }), settings);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toContain('雨');
      expect(r.hint && r.hint.length).toBeTruthy();
    }
  });

  it('鞋子全部待洗 → 提示去洗或标记可穿', () => {
    const wardrobe = [make({ category: 'top' }), make({ category: 'bottom' }), make({ category: 'shoes', isClean: false })];
    const r = recommendOutfit(wardrobe, [], input(), settings);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('待洗');
  });
});

describe('第六步：历史反馈影响后续推荐', () => {
  it('某单品多次踩雷后，后续推荐会避开它', () => {
    const wardrobe = [
      make({ id: 'topA', category: 'top', name: 'A' }),
      make({ id: 'topB', category: 'top', name: 'B' }),
      make({ id: 'b1', category: 'bottom' }),
      make({ id: 's1', category: 'shoes' }),
    ];
    const now = Date.now();
    const history: OutfitHistory[] = [0, 1, 2].map((k) => ({
      id: `h${k}`,
      items: [{ id: 'topA', name: 'A', category: 'top', color: 'white' }],
      input: input(),
      feedback: 'regret',
      createdAt: now - k * 1000,
    }));
    for (let n = 0; n < 8; n++) {
      const r = recommendOutfit(wardrobe, history, input(), settings);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.recommendation.items.some((i) => i.id === 'topA')).toBe(false);
    }
  });
});

describe('第七步：localStorage 归一化', () => {
  it('旧 ClothingItem 数据能 normalize 成新结构', () => {
    const oldItem = normalizeClothing({
      id: 'old',
      name: '旧白T',
      category: 'top',
      color: 'white',
      styleTags: ['minimal'],
      warmth: 2,
      comfort: 4,
      formality: 2,
      versatility: 5,
      suitableSeasons: ['summer'],
      suitableOccasions: ['casual'],
      isClean: true,
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });
    expect(oldItem.pattern).toBe('solid');
    expect(oldItem.material).toBeTruthy();
    expect(oldItem.fit).toBeTruthy();
    expect(oldItem.length).toBeTruthy();
    expect(oldItem.thickness).toBe(2);
    expect(oldItem.colorProfile.mainColor).toBe('white');
  });

  it('默认衣橱数据包含新字段的合理默认值', () => {
    for (const item of defaultClothing) {
      expect(item.pattern).toBeTruthy();
      expect(item.material).toBeTruthy();
      expect(item.fit).toBeTruthy();
      expect(item.length).toBeTruthy();
      expect(item.thickness).toBeGreaterThanOrEqual(1);
      expect(item.colorProfile.mainColor).toBeTruthy();
    }
  });

  it('异常历史数据被清洗后不会让推荐崩溃', () => {
    const bad = [null, 42, {}, { items: [{}] }, { items: [{ id: 's', name: '鞋', category: 'shoes', color: 'white' }], input: null }];
    const clean = normalizeHistory(bad);
    expect(() => recommendOutfit(defaultClothing, clean, input(), settings)).not.toThrow();
  });

  it('normalizeHistory 丢弃空记录、过滤非法字段、补默认值', () => {
    const raw = [
      null,
      42,
      {},
      { items: [] },
      { items: [{}] },
      { items: [{ id: 'x', name: '白T', category: 'top', color: 'white' }], input: { tempFeel: '冷', weather: '雪' }, feedback: '???', createdAt: 'bad' },
      {
        items: [{ id: 'y', name: '裙', category: 'dress', color: 'multi' }],
        input: { tempFeel: 'cold', weather: 'rainy', occasion: 'date', moods: ['gentle', 'xxx'], activity: 'walking' },
        feedback: 'like',
        createdAt: 123,
      },
    ];
    const out = normalizeHistory(raw);
    expect(out.length).toBe(2);
    expect(out[0].input.tempFeel).toBe('comfortable');
    expect(out[0].input.weather).toBe('sunny');
    expect(out[0].feedback).toBeUndefined();
    expect(typeof out[0].createdAt).toBe('number');
    expect(out[1].input.occasion).toBe('date');
    expect(out[1].input.moods).toEqual(['gentle']);
    expect(out[1].feedback).toBe('like');
  });

  it('normalizeHistory 对非数组返回空数组', () => {
    expect(normalizeHistory(null)).toEqual([]);
    expect(normalizeHistory('x')).toEqual([]);
    expect(normalizeHistory({})).toEqual([]);
  });
});
