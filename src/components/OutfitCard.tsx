import { useState } from 'react';
import { Check, Lightbulb, ShieldAlert, Sparkles } from 'lucide-react';
import { ClothingItem, Feedback, OutfitRecommendation } from '../types';
import { categoryLabels, colorHex, colorLabel, feedbackLabels, feedbackOptions, getColor } from '../lib/clothingOptions';

interface OutfitCardProps {
  recommendation: OutfitRecommendation;
  submittedFeedback?: Feedback;
  picked?: boolean;
  devMode?: boolean;
  onFeedback: (feedback: Feedback) => void;
  onPick: () => void;
}

function ItemRow({ item }: { item: ClothingItem }) {
  const isPattern = getColor(item.color).pattern;
  return (
    <div className="outfit-item">
      <span
        className={`outfit-item__swatch ${isPattern ? 'is-pattern' : ''}`}
        style={{ background: colorHex(item.color) }}
        aria-hidden="true"
      />
      <div className="outfit-item__text">
        <b>{item.name}</b>
        <small>
          {categoryLabels[item.category]} · {colorLabel(item.color)}
        </small>
      </div>
    </div>
  );
}

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
                  <p>维度: {Object.entries(outfit.breakdown).map(([k, v]) => `${k} ${Math.round(v)}`).join(' · ')}</p>
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
