import { useState } from 'react';
import { Check, ChevronDown, CloudSun, Lightbulb, MapPin, Palette, Ruler, ShieldAlert, Sparkles } from 'lucide-react';
import { ClothingItem, Feedback, OutfitBreakdownPart, OutfitRecommendation } from '../types';
import { categoryLabels, colorLabel, feedbackLabels, feedbackOptions } from '../lib/clothingOptions';
import { ClothingVisual } from './ClothingVisual';

interface OutfitCardProps {
  recommendation: OutfitRecommendation;
  submittedFeedback?: Feedback;
  picked?: boolean;
  devMode?: boolean;
  onFeedback: (feedback: Feedback) => void;
  onPick: () => void;
}

function ItemRow({ item }: { item: ClothingItem }) {
  return (
    <div className="outfit-item">
      <ClothingVisual item={item} className="outfit-item__visual" />
      <div className="outfit-item__text">
        <b>{item.name}</b>
        <small>
          {categoryLabels[item.category]} · {colorLabel(item.color)}
        </small>
      </div>
    </div>
  );
}

function OutfitCollage({ items }: { items: ClothingItem[] }) {
  return (
    <div className={`outfit-collage count-${Math.min(items.length, 5)}`} aria-label="推荐穿搭图片组合">
      {items.slice(0, 5).map((item) => (
        <ClothingVisual item={item} className="outfit-photo" key={item.id} />
      ))}
    </div>
  );
}

const analysisMeta: {
  key: keyof OutfitRecommendation['breakdown'];
  label: string;
  icon: typeof Palette;
}[] = [
  { key: 'color', label: '色彩', icon: Palette },
  { key: 'silhouette', label: '比例', icon: Ruler },
  { key: 'style', label: '风格', icon: Sparkles },
  { key: 'occasion', label: '场合', icon: MapPin },
  { key: 'weather', label: '天气舒适', icon: CloudSun },
];

const analysisLines = (part: OutfitBreakdownPart) =>
  [...part.reasons.slice(0, 2), ...part.warnings.slice(0, 1)].slice(0, 3);

export function OutfitCard({
  recommendation,
  submittedFeedback,
  picked = false,
  devMode = false,
  onFeedback,
  onPick,
}: OutfitCardProps) {
  const { items, copy, alternatives } = recommendation;
  const [showDebug, setShowDebug] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const locked = Boolean(submittedFeedback) || picked;

  return (
    <article className={`outfit-card anim-pop outfit-card--${copy.matchTone}`}>
      <div className="outfit-card__topline">
        <span className="outfit-card__eyebrow">
          <Sparkles size={14} /> 今日推荐
        </span>
        <span className={`match-pill tone-${copy.matchTone}`}>{copy.matchLabel}</span>
      </div>
      <h2>{copy.title}</h2>

      <OutfitCollage items={items} />

      <div className="outfit-items">
        {items.map((item) => (
          <ItemRow item={item} key={item.id} />
        ))}
      </div>

      <div className="card-label">为什么是这套</div>
      <p className="outfit-reason">{copy.reason}</p>

      {copy.warnings.length > 0 && (
        <div className="outfit-warnings">
          <ShieldAlert size={16} />
          <div>
            {copy.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      )}

      <div className="analysis-block">
        <button
          type="button"
          className="analysis-toggle"
          aria-expanded={showAnalysis}
          onClick={() => setShowAnalysis((value) => !value)}
        >
          <span>审美分析详情</span>
          <ChevronDown size={16} className={showAnalysis ? 'is-open' : ''} />
        </button>
        {showAnalysis && (
          <div className="analysis-panel">
            {analysisMeta.map((meta) => {
              const Icon = meta.icon;
              const part = recommendation.breakdown[meta.key];
              const lines = analysisLines(part);
              return (
                <section className="analysis-section" key={meta.key}>
                  <h3>
                    <Icon size={14} />
                    {meta.label}
                  </h3>
                  {lines.length ? (
                    lines.map((line) => <p key={line}>{line}</p>)
                  ) : (
                    <p>这一项没有明显风险，整体比较稳定。</p>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {alternatives.length > 0 && (
        <div className="outfit-alts">
          <div className="card-label">
            <Lightbulb size={14} /> 不想穿这套？也可以
          </div>
          {alternatives.map((alt, index) => (
            <div className="outfit-alt" key={index}>
              <span className="outfit-alt__note">{alt.note}</span>
              <span className="outfit-alt__names">{alt.items.map((item) => item.name).join(' + ')}</span>
            </div>
          ))}
        </div>
      )}

      {devMode && (
        <div className="recommend-debug">
          <button type="button" className="debug-toggle" aria-expanded={showDebug} onClick={() => setShowDebug((v) => !v)}>
            {showDebug ? '收起打分细节' : '展开打分细节'}
          </button>
          {showDebug && (
            <div className="debug-panel">
              {recommendation.scoredOutfits.map((outfit, index) => (
                <div className="debug-item" key={index}>
                  <div className="debug-item__head">
                    <b>
                      {index + 1}. {outfit.items.map((i) => i.name).join(' + ')}
                    </b>
                    <span>{outfit.score} 分</span>
                  </div>
                  <p>维度: {Object.entries(outfit.breakdown).map(([k, v]) => `${k} ${Math.round(v.score)}`).join(' · ')}</p>
                  <p>reasons: {outfit.reasons.length ? outfit.reasons.join('、') : '-'}</p>
                  <p>warnings: {outfit.warnings.length ? outfit.warnings.join('、') : '-'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="feedback-block">
        {!locked && (
          <button type="button" className="primary-button pick-button" onClick={onPick}>
            <Check size={18} />
            今天就穿这套
          </button>
        )}
        <div className="feedback-label">{locked ? '已记入穿搭历史 ✓' : '穿完顺手记个感受（可选）：'}</div>
        <div className="feedback-row">
          {feedbackOptions.map((feedback) => (
            <button
              key={feedback}
              type="button"
              className={`feedback-chip ${submittedFeedback === feedback ? 'is-active' : ''}`}
              onClick={() => onFeedback(feedback)}
              disabled={locked}
            >
              {feedbackLabels[feedback]}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
