import { useMemo, useState } from 'react';
import { Heart, Repeat, Shirt } from 'lucide-react';
import { OutfitHistoryList } from '../components/OutfitHistoryList';
import { Feedback, OutfitHistory } from '../types';

interface HistoryPageProps {
  history: OutfitHistory[];
  onSetFeedback: (id: string, feedback: Feedback) => void;
}

type FilterKey = 'worn' | 'skipped' | 'all';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'worn', label: '穿过' },
  { key: 'skipped', label: '跳过' },
  { key: 'all', label: '全部' },
];

export function HistoryPage({ history, onSetFeedback }: HistoryPageProps) {
  const [filter, setFilter] = useState<FilterKey>('worn');

  const worn = useMemo(() => history.filter((h) => h.feedback !== 'skipped'), [history]);

  const stats = useMemo(() => {
    const liked = worn.filter((h) => h.feedback === 'like').length;
    const count = new Map<string, number>();
    worn.slice(0, 30).forEach((h) => h.items.forEach((i) => count.set(i.name, (count.get(i.name) ?? 0) + 1)));
    const favourite = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
    return { worn: worn.length, liked, favourite: favourite && favourite[1] > 1 ? favourite[0] : null };
  }, [worn]);

  if (!history.length) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">穿搭历史</p>
            <h1>你的穿搭日记</h1>
          </div>
        </header>
        <div className="empty-state empty-state--card">
          <span className="empty-emoji">📖</span>
          <b>还没有穿搭记录</b>
          <span>去「今日推荐」搭一套，点「今天就穿这套」，这里就会慢慢记下你的偏好。</span>
        </div>
      </div>
    );
  }

  const skippedCount = history.length - worn.length;
  const filtered =
    filter === 'worn' ? worn : filter === 'skipped' ? history.filter((h) => h.feedback === 'skipped') : history;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">穿搭历史</p>
          <h1>你的穿搭日记</h1>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <Shirt size={17} />
          <span>记录的穿搭</span>
          <b>{stats.worn} 次</b>
        </div>
        <div className="stat-card">
          <Heart size={17} />
          <span>喜欢的</span>
          <b>{stats.liked} 套</b>
        </div>
        <div className="stat-card">
          <Repeat size={17} />
          <span>最常翻牌</span>
          <b>{stats.favourite ?? '还看不出'}</b>
        </div>
      </section>

      <div className="filter-row" role="group" aria-label="历史筛选">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`chip chip--small ${filter === item.key ? 'is-selected' : ''}`}
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
            {item.key === 'skipped' && skippedCount > 0 ? ` ${skippedCount}` : ''}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <OutfitHistoryList history={filtered} onSetFeedback={onSetFeedback} />
      ) : (
        <div className="empty-state">
          <span className="empty-emoji">🧷</span>
          这个分类还没有记录。
        </div>
      )}
    </div>
  );
}
