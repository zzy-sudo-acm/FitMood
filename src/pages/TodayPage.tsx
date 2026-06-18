import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Shirt, Sparkles, WandSparkles } from 'lucide-react';
import { OutfitCard } from '../components/OutfitCard';
import { ChipMultiSelect, Segmented } from '../components/inputs';
import {
  activityLabels,
  activityOptions,
  moodLabels,
  moodOptions,
  occasionLabels,
  occasionOptions,
  tempFeelLabels,
  tempFeelOptions,
  weatherLabels,
  weatherOptions,
} from '../lib/clothingOptions';
import { recommendOutfit } from '../lib/outfitRecommend';
import {
  Activity,
  ClothingItem,
  Feedback,
  Mood,
  Occasion,
  OutfitHistory,
  OutfitInput,
  RecommendResult,
  Settings,
  TempFeel,
  Weather,
} from '../types';

interface TodayPageProps {
  clothes: ClothingItem[];
  history: OutfitHistory[];
  settings: Settings;
  devMode: boolean;
  onWearOutfit: (items: ClothingItem[], input: OutfitInput, feedback?: Feedback) => void;
  onGoWardrobe: () => void;
}

const loadingLines = [
  '正在翻你的衣橱…',
  '正在搭配今天的你…',
  '正在比对颜色合不合…',
  '正在排除今天不合适的…',
  '正在挑一套不会出错的…',
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function TodayPage({ clothes, history, settings, devMode, onWearOutfit, onGoWardrobe }: TodayPageProps) {
  const [tempFeel, setTempFeel] = useState<TempFeel>('comfortable');
  const [weather, setWeather] = useState<Weather>('sunny');
  const [occasion, setOccasion] = useState<Occasion>('casual');
  const [moods, setMoods] = useState<Mood[]>(['comfy']);
  const [activity, setActivity] = useState<Activity>('normal');

  const [result, setResult] = useState<RecommendResult | null>(null);
  const [activeInput, setActiveInput] = useState<OutfitInput | null>(null);
  const [submittedFeedback, setSubmittedFeedback] = useState<Feedback | undefined>();
  const [picked, setPicked] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [loadingLine, setLoadingLine] = useState(loadingLines[0]);

  const timerRef = useRef<number | undefined>(undefined);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (result && !isDeciding && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }, [result, isDeciding]);

  const run = () => {
    const input: OutfitInput = { tempFeel, weather, occasion, moods, activity };
    setActiveInput(input);
    let next: RecommendResult;
    try {
      next = recommendOutfit(clothes, history, input, settings);
    } catch {
      next = { ok: false, reason: '出了点小状况', hint: '再试一次，或去衣橱检查一下单品。' };
    }
    setResult(next);
    setSubmittedFeedback(undefined);
    setPicked(false);
    setIsDeciding(false);
  };

  const decide = () => {
    if (isDeciding) return;
    window.clearTimeout(timerRef.current);
    if (prefersReducedMotion()) {
      run();
      return;
    }
    setLoadingLine(loadingLines[Math.floor(Math.random() * loadingLines.length)]);
    setIsDeciding(true);
    timerRef.current = window.setTimeout(run, 650 + Math.floor(Math.random() * 450));
  };

  const wear = (feedback?: Feedback) => {
    if (!result || !result.ok || !activeInput) return;
    if (submittedFeedback || picked) return;
    if (feedback) setSubmittedFeedback(feedback);
    else setPicked(true);
    onWearOutfit(result.recommendation.items, activeInput, feedback);
  };

  const summary = [tempFeelLabels[tempFeel], weatherLabels[weather], occasionLabels[occasion]].join(' · ');

  return (
    <div className="page today-page">
      <header className="app-header">
        <div>
          <p className="eyebrow">FitMood · 今天穿什么</p>
          <h1>说说今天，我来配一套</h1>
        </div>
      </header>

      <section className="section-block">
        <div className="section-title-row">
          <h2>温度体感</h2>
          <span className="hint">{tempFeelLabels[tempFeel]}</span>
        </div>
        <Segmented options={tempFeelOptions} value={tempFeel} onChange={setTempFeel} label={(t) => tempFeelLabels[t]} />
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <h2>天气</h2>
          <span className="hint">{weatherLabels[weather]}</span>
        </div>
        <Segmented options={weatherOptions} value={weather} onChange={setWeather} label={(w) => weatherLabels[w]} />
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <h2>今天去哪 / 做什么</h2>
          <span className="hint">{occasionLabels[occasion]}</span>
        </div>
        <Segmented options={occasionOptions} value={occasion} onChange={setOccasion} label={(o) => occasionLabels[o]} />
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <h2>今天的心情</h2>
          <span className="hint">已选 {moods.length}</span>
        </div>
        <ChipMultiSelect options={moodOptions} value={moods} onChange={setMoods} label={(m) => moodLabels[m]} />
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <h2>今天会怎么动</h2>
          <span className="hint">{activityLabels[activity]}</span>
        </div>
        <Segmented options={activityOptions} value={activity} onChange={setActivity} label={(a) => activityLabels[a]} />
      </section>

      {isDeciding && (
        <div ref={resultRef}>
          <div className="outfit-loading" role="status" aria-live="polite" aria-busy="true">
            <RefreshCw size={18} className="spin" />
            <span>{loadingLine}</span>
          </div>
        </div>
      )}

      {result && !isDeciding && (
        <div ref={resultRef}>
          {result.ok ? (
            <OutfitCard
              recommendation={result.recommendation}
              submittedFeedback={submittedFeedback}
              picked={picked}
              devMode={devMode}
              onFeedback={(feedback) => wear(feedback)}
              onPick={() => wear()}
            />
          ) : (
            <div className="empty-state empty-state--card">
              <Shirt size={30} strokeWidth={1.6} />
              <b>{result.reason}</b>
              {result.hint && <span>{result.hint}</span>}
              <button type="button" className="ghost-button" onClick={onGoWardrobe}>
                去我的衣橱看看
              </button>
            </div>
          )}
        </div>
      )}

      <div className="sticky-action">
        <div className="decision-context">{summary}</div>
        <button
          type="button"
          className={`primary-button primary-button--large ${isDeciding ? 'is-busy' : ''}`}
          onClick={decide}
          disabled={isDeciding}
        >
          {isDeciding ? (
            <RefreshCw size={20} className="spin" />
          ) : result ? (
            <WandSparkles size={20} />
          ) : (
            <Sparkles size={20} />
          )}
          {isDeciding ? '搭配中…' : result ? '换一套' : '帮我搭配今天'}
        </button>
      </div>
    </div>
  );
}
