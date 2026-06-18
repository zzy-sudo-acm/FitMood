import { FormEvent, useState } from 'react';
import { Save, X } from 'lucide-react';
import { Category, ClothingItem, Occasion, Rating, Season, StyleTag } from '../types';
import {
  categoryLabels,
  categoryOptions,
  colorOptions,
  occasionLabels,
  occasionOptions,
  ratingMeta,
  seasonLabels,
  seasonOptions,
  styleTagLabels,
  styleTagOptions,
  utilityTagLabel,
  utilityTagOptions,
} from '../lib/clothingOptions';
import { makeId } from '../lib/storage';
import { ChipMultiSelect, RatingBar, Segmented } from './inputs';

interface ClothingFormProps {
  initial?: ClothingItem;
  onCancel: () => void;
  onSave: (item: ClothingItem) => void;
}

export function ClothingForm({ initial, onCancel, onSave }: ClothingFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'top');
  const [color, setColor] = useState<string>(initial?.color ?? 'white');
  const [styleTags, setStyleTags] = useState<StyleTag[]>((initial?.styleTags as StyleTag[]) ?? []);
  const [warmth, setWarmth] = useState<Rating>(initial?.warmth ?? 3);
  const [comfort, setComfort] = useState<Rating>(initial?.comfort ?? 4);
  const [formality, setFormality] = useState<Rating>(initial?.formality ?? 3);
  const [versatility, setVersatility] = useState<Rating>(initial?.versatility ?? 4);
  const [seasons, setSeasons] = useState<Season[]>(initial?.suitableSeasons ?? []);
  const [occasions, setOccasions] = useState<Occasion[]>(initial?.suitableOccasions ?? []);
  const [isClean, setIsClean] = useState(initial?.isClean ?? true);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);

  const ratingState: Record<string, [Rating, (v: Rating) => void]> = {
    warmth: [warmth, setWarmth],
    comfort: [comfort, setComfort],
    formality: [formality, setFormality],
    versatility: [versatility, setVersatility],
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const time = Date.now();
    onSave({
      id: initial?.id ?? makeId('cloth'),
      name: trimmed,
      category,
      color,
      styleTags,
      warmth,
      comfort,
      formality,
      versatility,
      suitableSeasons: seasons,
      suitableOccasions: occasions,
      isClean,
      tags,
      lastWornAt: initial?.lastWornAt,
      createdAt: initial?.createdAt ?? time,
      updatedAt: time,
    });
  };

  return (
    <form className="clothing-form" onSubmit={handleSubmit}>
      <div className="form-head">
        <h2>{initial ? '编辑单品' : '添加单品'}</h2>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="关闭" title="关闭">
          <X size={18} />
        </button>
      </div>

      <label className="field">
        <span>名称</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="例如：白色短袖、浅蓝牛仔裤"
          autoFocus
        />
      </label>

      <div className="form-group">
        <span className="form-group__label">分类</span>
        <Segmented options={categoryOptions} value={category} onChange={setCategory} label={(c) => categoryLabels[c]} />
      </div>

      <div className="form-group">
        <span className="form-group__label">颜色</span>
        <div className="color-grid">
          {colorOptions.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`color-swatch ${color === c.id ? 'is-selected' : ''}`}
              style={{ background: c.hex }}
              aria-label={c.label}
              aria-pressed={color === c.id}
              title={c.label}
              onClick={() => setColor(c.id)}
            >
              {c.pattern && <span className="color-swatch__pattern" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <span className="form-group__label">风格</span>
        <ChipMultiSelect
          options={styleTagOptions}
          value={styleTags}
          onChange={setStyleTags}
          label={(t) => styleTagLabels[t]}
          small
        />
      </div>

      <div className="form-group">
        <span className="form-group__label">属性</span>
        <div className="rating-list">
          {ratingMeta.map((meta) => {
            const [value, setValue] = ratingState[meta.key];
            return (
              <div className="rating-row" key={meta.key}>
                <div className="rating-row__head">
                  <b>{meta.label}</b>
                  <small>{meta.hint}</small>
                </div>
                <RatingBar value={value} onChange={(v) => setValue(v as Rating)} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-group">
        <span className="form-group__label">适合季节</span>
        <ChipMultiSelect options={seasonOptions} value={seasons} onChange={setSeasons} label={(s) => seasonLabels[s]} small />
      </div>

      <div className="form-group">
        <span className="form-group__label">适合场合</span>
        <ChipMultiSelect
          options={occasionOptions}
          value={occasions}
          onChange={setOccasions}
          label={(o) => occasionLabels[o]}
          small
        />
      </div>

      <div className="form-group">
        <span className="form-group__label">其他标签</span>
        <ChipMultiSelect options={utilityTagOptions} value={tags} onChange={setTags} label={utilityTagLabel} small />
      </div>

      <label className="toggle-row">
        <span>现在干净可穿</span>
        <input type="checkbox" checked={isClean} onChange={(event) => setIsClean(event.target.checked)} />
      </label>

      <button type="submit" className="primary-button">
        <Save size={18} />
        保存
      </button>
    </form>
  );
}
