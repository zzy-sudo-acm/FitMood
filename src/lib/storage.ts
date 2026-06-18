import { defaultClothing } from '../data/defaultClothing';
import {
  Activity,
  Category,
  ClothingItem,
  ColdTolerance,
  ColorProfile,
  Feedback,
  Fit,
  GarmentLength,
  Material,
  Mood,
  Occasion,
  Pattern,
  OutfitHistory,
  OutfitInput,
  OutfitItemRef,
  Rating,
  RecommendPreference,
  Season,
  Settings,
  StyleTag,
  TempFeel,
  Weather,
} from '../types';
import { getColor } from './clothingOptions';

const CLOTHING_KEY = 'fitmood.clothing.v1';
const HISTORY_KEY = 'fitmood.history.v1';
const THEME_KEY = 'fitmood.theme.v1';
const DEV_MODE_KEY = 'fitmood.devMode.v1';
const SETTINGS_KEY = 'fitmood.settings.v1';

export type ThemeMode = 'day' | 'night';

export const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const inEnum = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value);

// ---- 主题 / 开发者模式 ----
export const loadTheme = (): ThemeMode => (localStorage.getItem(THEME_KEY) === 'night' ? 'night' : 'day');
export const saveTheme = (theme: ThemeMode) => localStorage.setItem(THEME_KEY, theme);

export const loadDevMode = (): boolean => localStorage.getItem(DEV_MODE_KEY) === 'on';
export const saveDevMode = (devMode: boolean) => localStorage.setItem(DEV_MODE_KEY, devMode ? 'on' : 'off');

// ---- 枚举取值表 ----
const categoryValues: Category[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'];
const seasonValues: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const occasionValues: Occasion[] = ['class', 'commute', 'date', 'interview', 'photo', 'sport', 'home', 'casual'];
const coldToleranceValues: ColdTolerance[] = ['coldProne', 'normal', 'hotProne'];
const recommendPreferenceValues: RecommendPreference[] = ['comfy', 'pretty', 'safe', 'photo'];
const styleTagValues: StyleTag[] = [
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
const tempFeelValues: TempFeel[] = ['cold', 'cool', 'comfortable', 'hot'];
const weatherValues: Weather[] = ['sunny', 'cloudy', 'rainy', 'windy'];
const activityValues: Activity[] = ['sitting', 'normal', 'walking'];
const moodValues: Mood[] = ['comfy', 'slim', 'gentle', 'cool', 'easy', 'delicate', 'lowkey', 'photogenic'];
const patternValues: Pattern[] = ['solid', 'stripe', 'check', 'floral', 'graphic', 'dot', 'other'];
const materialValues: Material[] = [
  'cotton',
  'denim',
  'knit',
  'wool',
  'chiffon',
  'leather',
  'linen',
  'polyester',
  'other',
];
const fitValues: Fit[] = ['slim', 'regular', 'loose', 'oversized'];
const lengthValues: GarmentLength[] = ['cropped', 'regular', 'long'];
const feedbackValues: Feedback[] = [
  'like',
  'ok',
  'uncomfortable',
  'tooCold',
  'tooHot',
  'wrongOccasion',
  'regret',
  'skipped',
];

// ---- 设置 ----
export const defaultSettings: Settings = {
  coldTolerance: 'normal',
  stylePreference: [],
  recommendPreference: 'safe',
};

export const normalizeSettings = (value: unknown): Settings => {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<Settings>;
  return {
    coldTolerance: inEnum(raw.coldTolerance, coldToleranceValues) ? raw.coldTolerance : 'normal',
    stylePreference: Array.isArray(raw.stylePreference)
      ? Array.from(new Set(raw.stylePreference.filter((s): s is StyleTag => inEnum(s, styleTagValues))))
      : [],
    recommendPreference: inEnum(raw.recommendPreference, recommendPreferenceValues) ? raw.recommendPreference : 'safe',
  };
};

export const loadSettings = (): Settings =>
  normalizeSettings(safeParse<Partial<Settings>>(localStorage.getItem(SETTINGS_KEY), {}));

export const saveSettings = (settings: Settings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

// ---- 衣物归一化 ----
const clampRating = (value: unknown, fallback: Rating): Rating => {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(5, Math.max(1, n)) as Rating;
};

const filterEnum = <T extends string>(value: unknown, allowed: T[]): T[] =>
  Array.isArray(value) ? Array.from(new Set(value.filter((v): v is T => inEnum(v, allowed)))) : [];

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? Array.from(new Set(value.filter((v): v is string => typeof v === 'string'))) : [];

type ClothingDraft = Partial<ClothingItem>;

const clampString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const defaultColorProfile = (colorId: string): ColorProfile => {
  const color = getColor(colorId);
  const warm = ['warm', 'purple'].includes(color.family);
  const cool = color.family === 'cool' || color.id === 'denim' || color.id === 'navy';
  const brightness: Record<string, Rating> = {
    white: 5,
    beige: 4,
    yellow: 5,
    pink: 4,
    mint: 4,
    skyblue: 4,
    lavender: 4,
    gray: 3,
    denim: 3,
    khaki: 3,
    brown: 2,
    navy: 2,
    black: 1,
  };
  const saturation: Record<string, Rating> = {
    white: 1,
    black: 1,
    gray: 1,
    beige: 1,
    brown: 2,
    denim: 2,
    navy: 2,
    khaki: 2,
    rose: 4,
    red: 5,
    coral: 4,
    yellow: 4,
    blue: 4,
    purple: 4,
    multi: 5,
  };
  return {
    mainColor: color.id,
    secondaryColors: color.pattern ? ['white', 'pink'] : [],
    neutralLevel: (color.neutral ? 5 : color.family === 'pattern' ? 1 : 2) as Rating,
    brightness: brightness[color.id] ?? 3,
    saturation: saturation[color.id] ?? (color.neutral ? 1 : 3),
    temperature: color.neutral ? 'neutral' : warm ? 'warm' : cool ? 'cool' : 'neutral',
  };
};

const normalizeColorProfile = (value: unknown, colorId: string): ColorProfile => {
  const fallback = defaultColorProfile(colorId);
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Partial<ColorProfile>;
  const temperature =
    raw.temperature === 'warm' || raw.temperature === 'cool' || raw.temperature === 'neutral'
      ? raw.temperature
      : fallback.temperature;
  return {
    mainColor: typeof raw.mainColor === 'string' && raw.mainColor ? raw.mainColor : fallback.mainColor,
    secondaryColors: stringArray(raw.secondaryColors).slice(0, 3),
    neutralLevel: clampRating(raw.neutralLevel, fallback.neutralLevel),
    brightness: clampRating(raw.brightness, fallback.brightness),
    saturation: clampRating(raw.saturation, fallback.saturation),
    temperature,
  };
};

const defaultPatternFor = (item: ClothingDraft): Pattern => {
  if (inEnum(item.pattern, patternValues)) return item.pattern;
  const color = typeof item.color === 'string' ? getColor(item.color) : getColor('white');
  if (color.pattern) return item.category === 'dress' ? 'floral' : 'graphic';
  return 'solid';
};

const defaultMaterialFor = (item: ClothingDraft): Material => {
  if (inEnum(item.material, materialValues)) return item.material;
  if (item.color === 'denim') return 'denim';
  if (item.tags?.includes('breathable')) return 'cotton';
  if (item.name?.includes('针织')) return 'knit';
  if (item.name?.includes('大衣')) return 'wool';
  if (item.category === 'shoes' || item.category === 'bag') return 'leather';
  return 'cotton';
};

const defaultFitFor = (item: ClothingDraft): Fit => {
  if (inEnum(item.fit, fitValues)) return item.fit;
  if (item.name?.includes('卫衣')) return 'loose';
  if (item.tags?.includes('slimming')) return 'slim';
  if (item.category === 'outerwear') return 'regular';
  return 'regular';
};

const defaultLengthFor = (item: ClothingDraft): GarmentLength => {
  if (inEnum(item.length, lengthValues)) return item.length;
  if (item.tags?.includes('longHem') || item.name?.includes('大衣')) return 'long';
  if (item.name?.includes('短')) return 'cropped';
  return 'regular';
};

export const normalizeClothing = (item: ClothingDraft): ClothingItem => {
  const createdAt =
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : Date.now();
  const updatedAt =
    typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : createdAt;
  const color = typeof item.color === 'string' && item.color ? item.color : 'white';
  const pattern = defaultPatternFor(item);
  return {
    id: typeof item.id === 'string' && item.id ? item.id : makeId('cloth'),
    name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : '未命名单品',
    category: inEnum(item.category, categoryValues) ? item.category : 'top',
    color,
    styleTags: filterEnum<StyleTag>(item.styleTags, styleTagValues),
    warmth: clampRating(item.warmth, 3),
    comfort: clampRating(item.comfort, 3),
    formality: clampRating(item.formality, 3),
    versatility: clampRating(item.versatility, 3),
    suitableSeasons: filterEnum<Season>(item.suitableSeasons, seasonValues),
    suitableOccasions: filterEnum<Occasion>(item.suitableOccasions, occasionValues),
    isClean: typeof item.isClean === 'boolean' ? item.isClean : true,
    tags: stringArray(item.tags),
    imageId: clampString(item.imageId),
    imageThumb: clampString(item.imageThumb),
    imageAlt: clampString(item.imageAlt) ?? (typeof item.name === 'string' ? item.name.trim() : undefined),
    pattern,
    material: defaultMaterialFor(item),
    fit: defaultFitFor(item),
    length: defaultLengthFor(item),
    thickness: clampRating(item.thickness, clampRating(item.warmth, 3)),
    colorProfile: normalizeColorProfile(item.colorProfile, color),
    lastWornAt:
      typeof item.lastWornAt === 'number' && Number.isFinite(item.lastWornAt) ? item.lastWornAt : undefined,
    createdAt,
    updatedAt,
  };
};

export const normalizeClothingList = (items: ClothingDraft[]) => items.map(normalizeClothing);

const cloneDefaults = (): ClothingItem[] => defaultClothing.map((c) => normalizeClothing({ ...c }));

export const loadClothing = (): ClothingItem[] => {
  const stored = safeParse<unknown>(localStorage.getItem(CLOTHING_KEY), null);
  if (Array.isArray(stored)) {
    if (!stored.length) return []; // 用户清空过 → 尊重空衣橱
    const normalized = normalizeClothingList(stored as ClothingDraft[]);
    if (JSON.stringify(normalized) !== JSON.stringify(stored)) saveClothing(normalized);
    return normalized;
  }
  // 没存过 / 数据损坏 → 灌入默认衣橱
  const defaults = cloneDefaults();
  saveClothing(defaults);
  return defaults;
};

export const saveClothing = (items: ClothingItem[]) =>
  localStorage.setItem(CLOTHING_KEY, JSON.stringify(normalizeClothingList(items)));

export const resetClothing = (): ClothingItem[] => {
  const defaults = cloneDefaults();
  saveClothing(defaults);
  return defaults;
};

export const clearClothing = (): ClothingItem[] => {
  saveClothing([]);
  return [];
};

/** 把指定单品标记为「刚穿过」，用于推荐时短期降权。 */
export const markWorn = (items: ClothingItem[], wornIds: string[], when = Date.now()): ClothingItem[] => {
  const set = new Set(wornIds);
  return items.map((item) => (set.has(item.id) ? { ...item, lastWornAt: when } : item));
};

// ---- 穿搭历史归一化（兼容旧数据 / 异常数据，避免页面崩）----
const normalizeInput = (input: unknown): OutfitInput => {
  const i = (input ?? {}) as Record<string, unknown>;
  return {
    tempFeel: inEnum(i.tempFeel, tempFeelValues) ? i.tempFeel : 'comfortable',
    weather: inEnum(i.weather, weatherValues) ? i.weather : 'sunny',
    occasion: inEnum(i.occasion, occasionValues) ? i.occasion : 'casual',
    moods: filterEnum<Mood>(i.moods, moodValues),
    activity: inEnum(i.activity, activityValues) ? i.activity : 'normal',
  };
};

const normalizeItemRef = (ref: unknown): OutfitItemRef | null => {
  if (!ref || typeof ref !== 'object') return null;
  const r = ref as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id : '';
  const name = typeof r.name === 'string' ? r.name : '';
  if (!id && !name) return null;
  return {
    id: id || makeId('ref'),
    name: name || '单品',
    category: inEnum(r.category, categoryValues) ? r.category : 'top',
    color: typeof r.color === 'string' && r.color ? r.color : 'white',
    imageThumb: clampString(r.imageThumb),
  };
};

export const normalizeHistoryEntry = (entry: unknown): OutfitHistory | null => {
  if (!entry || typeof entry !== 'object') return null;
  const e = entry as Record<string, unknown>;
  const items = Array.isArray(e.items)
    ? e.items.map(normalizeItemRef).filter((r): r is OutfitItemRef => r !== null)
    : [];
  if (!items.length) return null; // 没有单品的记录无意义，丢弃
  return {
    id: typeof e.id === 'string' && e.id ? e.id : makeId('outfit'),
    items,
    input: normalizeInput(e.input),
    feedback: inEnum(e.feedback, feedbackValues) ? e.feedback : undefined,
    createdAt: typeof e.createdAt === 'number' && Number.isFinite(e.createdAt) ? e.createdAt : Date.now(),
  };
};

export const normalizeHistory = (raw: unknown): OutfitHistory[] =>
  Array.isArray(raw) ? raw.map(normalizeHistoryEntry).filter((e): e is OutfitHistory => e !== null) : [];

export const loadHistory = (): OutfitHistory[] => {
  const raw = safeParse<unknown>(localStorage.getItem(HISTORY_KEY), []);
  const normalized = normalizeHistory(raw);
  if (JSON.stringify(normalized) !== JSON.stringify(raw)) saveHistory(normalized);
  return normalized;
};

export const saveHistory = (history: OutfitHistory[]) => localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

export const addHistory = (entry: OutfitHistory): OutfitHistory[] => {
  const next = [entry, ...loadHistory()].slice(0, 120);
  saveHistory(next);
  return next;
};

export const clearHistory = () => saveHistory([]);
