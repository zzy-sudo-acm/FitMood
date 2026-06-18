import { defaultClothing } from '../data/defaultClothing';
import {
  Activity,
  Category,
  ClothingItem,
  ColdTolerance,
  Feedback,
  Mood,
  Occasion,
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

export const loadSettings = (): Settings => {
  const raw = safeParse<Partial<Settings>>(localStorage.getItem(SETTINGS_KEY), {});
  return {
    coldTolerance: inEnum(raw.coldTolerance, coldToleranceValues) ? raw.coldTolerance : 'normal',
    stylePreference: Array.isArray(raw.stylePreference)
      ? Array.from(new Set(raw.stylePreference.filter((s): s is StyleTag => inEnum(s, styleTagValues))))
      : [],
    recommendPreference: inEnum(raw.recommendPreference, recommendPreferenceValues) ? raw.recommendPreference : 'safe',
  };
};

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

export const normalizeClothing = (item: ClothingDraft): ClothingItem => {
  const createdAt =
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : Date.now();
  const updatedAt =
    typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : createdAt;
  return {
    id: typeof item.id === 'string' && item.id ? item.id : makeId('cloth'),
    name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : '未命名单品',
    category: inEnum(item.category, categoryValues) ? item.category : 'top',
    color: typeof item.color === 'string' && item.color ? item.color : 'white',
    styleTags: filterEnum<StyleTag>(item.styleTags, styleTagValues),
    warmth: clampRating(item.warmth, 3),
    comfort: clampRating(item.comfort, 3),
    formality: clampRating(item.formality, 3),
    versatility: clampRating(item.versatility, 3),
    suitableSeasons: filterEnum<Season>(item.suitableSeasons, seasonValues),
    suitableOccasions: filterEnum<Occasion>(item.suitableOccasions, occasionValues),
    isClean: typeof item.isClean === 'boolean' ? item.isClean : true,
    tags: stringArray(item.tags),
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
