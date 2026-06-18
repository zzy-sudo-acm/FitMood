import { Clock3 } from 'lucide-react';
import { Feedback, OutfitHistory } from '../types';
import {
  colorHex,
  feedbackLabels,
  feedbackOptions,
  moodLabel,
  occasionLabels,
  tempFeelLabels,
  weatherLabels,
} from '../lib/clothingOptions';

interface OutfitHistoryListProps {
  history: OutfitHistory[];
  onSetFeedback: (id: string, feedback: Feedback) => void;
}

const formatTime = (time: number) =>
  new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(time);

export function OutfitHistoryList({ history, onSetFeedback }: OutfitHistoryListProps) {
  return (
    <div className="history-list">
      {history.map((entry) => {
        const conditions = [
          tempFeelLabels[entry.input.tempFeel],
          weatherLabels[entry.input.weather],
          occasionLabels[entry.input.occasion],
          ...entry.input.moods.slice(0, 2).map(moodLabel),
        ];
        return (
          <article className="history-item" key={entry.id}>
            <div className="history-item__top">
              <span className="history-time">
                <Clock3 size={14} />
                {formatTime(entry.createdAt)}
              </span>
              {entry.feedback === 'skipped' && <span className="history-skip">跳过</span>}
            </div>

            <div className="history-outfit">
              {entry.items.map((item) => (
                <span className="history-chip" key={item.id}>
                  <span className={`history-chip__dot ${item.imageThumb ? 'has-image' : ''}`} style={{ background: colorHex(item.color) }} aria-hidden="true">
                    {item.imageThumb && <img src={item.imageThumb} alt="" />}
                  </span>
                  {item.name}
                </span>
              ))}
            </div>

            <p className="history-cond">{conditions.join(' · ')}</p>

            <div className="history-feedback">
              {feedbackOptions.map((feedback) => (
                <button
                  key={feedback}
                  type="button"
                  className={`feedback-chip feedback-chip--mini ${entry.feedback === feedback ? 'is-active' : ''}`}
                  onClick={() => onSetFeedback(entry.id, feedback)}
                >
                  {feedbackLabels[feedback]}
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
