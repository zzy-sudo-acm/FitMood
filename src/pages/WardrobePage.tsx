import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { ClothingForm } from '../components/ClothingForm';
import { ClothingCard } from '../components/ClothingCard';
import { Category, ClothingItem } from '../types';
import { categoryLabels, categoryOptions, styleTagLabel, utilityTagLabel } from '../lib/clothingOptions';

interface WardrobePageProps {
  clothes: ClothingItem[];
  onSave: (item: ClothingItem) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onToggleClean: (item: ClothingItem) => void;
}

type FilterKey = 'all' | Category;

export function WardrobePage({ clothes, onSave, onDelete, onToggleClean }: WardrobePageProps) {
  const [editing, setEditing] = useState<ClothingItem | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...clothes]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((item) => filter === 'all' || item.category === filter)
      .filter((item) => {
        if (!q) return true;
        const haystack = [item.name, ...item.styleTags.map(styleTagLabel), ...item.tags.map(utilityTagLabel)]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
  }, [clothes, filter, query]);

  const openAdd = () => {
    setEditing(undefined);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (item: ClothingItem) => {
    await onSave(item);
    setEditing(undefined);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    const item = clothes.find((c) => c.id === id);
    if (!item) return;
    if (!window.confirm(`从衣橱里删掉「${item.name}」？`)) return;
    await onDelete(id);
  };

  const filters: FilterKey[] = ['all', ...categoryOptions];
  const cleanCount = clothes.filter((c) => c.isClean).length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">我的衣橱</p>
          <h1>{clothes.length} 件单品 · {cleanCount} 件可穿</h1>
        </div>
        <button type="button" className="icon-text-button" onClick={openAdd}>
          <Plus size={18} />
          添加
        </button>
      </header>

      {(showForm || editing) && (
        <ClothingForm
          initial={editing}
          onCancel={() => {
            setEditing(undefined);
            setShowForm(false);
          }}
          onSave={handleSave}
        />
      )}

      <div className="search-row">
        <Search size={16} />
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜名称或标签，比如「牛仔」「显瘦」"
          aria-label="搜索单品"
        />
      </div>

      <div className="filter-row" role="group" aria-label="分类筛选">
        {filters.map((key) => (
          <button
            key={key}
            type="button"
            className={`chip chip--small ${filter === key ? 'is-selected' : ''}`}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? '全部' : categoryLabels[key]}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="clothing-list">
          {visible.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onEdit={(it) => {
                setEditing(it);
                setShowForm(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDelete={handleDelete}
              onToggleClean={onToggleClean}
            />
          ))}
        </div>
      ) : clothes.length === 0 ? (
        <div className="empty-state empty-state--card">
          <span className="empty-emoji">🧺</span>
          <b>衣橱还是空的</b>
          <span>先添加几件常穿单品吧，添加越多，搭配越懂你。</span>
          <button type="button" className="ghost-button" onClick={openAdd}>
            <Plus size={16} />
            添加第一件
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-emoji">🔍</span>
          这个分类还没有单品，换个筛选或点右上角添加。
        </div>
      )}
    </div>
  );
}
