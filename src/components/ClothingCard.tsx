import { Pencil, Trash2 } from 'lucide-react';
import { ClothingItem } from '../types';
import { categoryLabels, colorHex, colorLabel, getColor, styleTagLabel, utilityTagLabel } from '../lib/clothingOptions';

interface ClothingCardProps {
  item: ClothingItem;
  onEdit: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onToggleClean: (item: ClothingItem) => void;
}

export function ClothingCard({ item, onEdit, onDelete, onToggleClean }: ClothingCardProps) {
  const isPattern = getColor(item.color).pattern;
  const chips = [...item.styleTags.map(styleTagLabel), ...item.tags.map(utilityTagLabel)].slice(0, 4);

  return (
    <article className={`clothing-card ${item.isClean ? '' : 'is-dirty'}`}>
      <span
        className={`clothing-card__swatch ${isPattern ? 'is-pattern' : ''}`}
        style={{ background: colorHex(item.color) }}
        aria-hidden="true"
      />
      <div className="clothing-card__body">
        <div className="clothing-card__head">
          <h3>{item.name}</h3>
          <button
            type="button"
            className={`clean-pill ${item.isClean ? 'is-clean' : 'is-dirty'}`}
            onClick={() => onToggleClean(item)}
            title={item.isClean ? '点一下标记为待洗' : '点一下标记为可穿'}
          >
            {item.isClean ? '可穿' : '待洗'}
          </button>
        </div>
        <p className="clothing-card__meta">
          {categoryLabels[item.category]} · {colorLabel(item.color)} · 保暖 {item.warmth} · 舒适 {item.comfort}
        </p>
        {chips.length > 0 && (
          <div className="tag-row">
            {chips.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        )}
      </div>
      <div className="clothing-card__actions">
        <button type="button" className="icon-button" onClick={() => onEdit(item)} aria-label={`编辑 ${item.name}`} title="编辑">
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="icon-button danger"
          onClick={() => onDelete(item.id)}
          aria-label={`删除 ${item.name}`}
          title="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
