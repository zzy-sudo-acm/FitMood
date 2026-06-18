import { ChangeEvent, FormEvent, useState } from 'react';
import { ImagePlus, Save, Trash2, X } from 'lucide-react';
import { Category, ClothingItem, Fit, GarmentLength, Material, Occasion, Pattern, Rating, Season, StyleTag } from '../types';
import {
  categoryLabels,
  categoryOptions,
  colorOptions,
  fitLabels,
  fitOptions,
  lengthLabels,
  lengthOptions,
  materialLabels,
  materialOptions,
  occasionLabels,
  occasionOptions,
  patternLabels,
  patternOptions,
  ratingMeta,
  seasonLabels,
  seasonOptions,
  styleTagLabels,
  styleTagOptions,
  utilityTagLabel,
  utilityTagOptions,
} from '../lib/clothingOptions';
import { defaultColorProfile, makeId } from '../lib/storage';
import { deleteClothingImage, isImageStoreAvailable, saveClothingImage } from '../lib/imageStore';
import { ChipMultiSelect, RatingBar, Segmented } from './inputs';

interface ClothingFormProps {
  initial?: ClothingItem;
  onCancel: () => void;
  onSave: (item: ClothingItem) => void | Promise<void>;
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
  const [imageId, setImageId] = useState<string | undefined>(initial?.imageId);
  const [imageThumb, setImageThumb] = useState<string | undefined>(initial?.imageThumb);
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? initial?.name ?? '');
  const [newImageId, setNewImageId] = useState<string | undefined>();
  const [imageMessage, setImageMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pattern, setPattern] = useState<Pattern>(initial?.pattern ?? 'solid');
  const [material, setMaterial] = useState<Material>(initial?.material ?? 'cotton');
  const [fit, setFit] = useState<Fit>(initial?.fit ?? 'regular');
  const [length, setLength] = useState<GarmentLength>(initial?.length ?? 'regular');
  const [thickness, setThickness] = useState<Rating>(initial?.thickness ?? initial?.warmth ?? 3);

  const ratingState: Record<string, [Rating, (v: Rating) => void]> = {
    warmth: [warmth, setWarmth],
    comfort: [comfort, setComfort],
    formality: [formality, setFormality],
    versatility: [versatility, setVersatility],
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setIsUploading(true);
    setImageMessage('');
    try {
      const saved = await saveClothingImage(file);
      if (newImageId && newImageId !== saved.imageId) await deleteClothingImage(newImageId);
      setImageId(saved.imageId);
      setImageThumb(saved.thumbDataUrl);
      setImageAlt((prev) => prev || name.trim() || initial?.name || '衣物照片');
      setNewImageId(saved.imageId);
      setImageMessage(
        saved.storage === 'indexedDB' && isImageStoreAvailable()
          ? '图片已保存在本机浏览器，不会上传到外部服务。'
          : '当前浏览器无法稳定使用 IndexedDB，已先保存缩略图兜底。'
      );
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : '图片处理失败，换一张试试。');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    if (newImageId && imageId === newImageId) await deleteClothingImage(newImageId);
    setImageId(undefined);
    setImageThumb(undefined);
    setImageAlt('');
    setNewImageId(undefined);
    setImageMessage('已移除图片，保存后这件单品会只显示颜色兜底。');
  };

  const cancel = async () => {
    if (newImageId) await deleteClothingImage(newImageId);
    onCancel();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const time = Date.now();
    await onSave({
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
      imageId,
      imageThumb,
      imageAlt: imageAlt.trim() || trimmed,
      pattern,
      material,
      fit,
      length,
      thickness,
      colorProfile: initial?.color === color && initial.colorProfile ? initial.colorProfile : defaultColorProfile(color),
      lastWornAt: initial?.lastWornAt,
      createdAt: initial?.createdAt ?? time,
      updatedAt: time,
    });
    setNewImageId(undefined);
  };

  return (
    <form className="clothing-form" onSubmit={handleSubmit}>
      <div className="form-head">
        <h2>{initial ? '编辑单品' : '添加单品'}</h2>
        <button type="button" className="icon-button" onClick={cancel} aria-label="关闭" title="关闭">
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
        <span className="form-group__label">衣物照片</span>
        <div className={`image-upload ${imageThumb ? 'has-image' : ''}`}>
          <div className="image-upload__preview">
            {imageThumb ? (
              <img src={imageThumb} alt={imageAlt || name || '衣物照片'} />
            ) : (
              <span style={{ background: colorOptions.find((c) => c.id === color)?.hex }} aria-hidden="true" />
            )}
          </div>
          <div className="image-upload__actions">
            <label className="file-pick">
              <ImagePlus size={16} />
              {isUploading ? '处理中…' : imageThumb ? '换一张' : '上传照片'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={isUploading}
              />
            </label>
            {imageThumb && (
              <button type="button" className="ghost-button ghost-button--compact danger-text" onClick={removeImage}>
                <Trash2 size={15} />
                移除
              </button>
            )}
          </div>
        </div>
        <small className="field-hint">
          支持 jpg、png、webp；原图会压缩后只保存在本机浏览器。
          {imageMessage && <span className="field-hint__line">{imageMessage}</span>}
        </small>
      </div>

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
        <span className="form-group__label">审美细节</span>
        <div className="aesthetic-fields">
          <label className="field">
            <span>面料</span>
            <select value={material} onChange={(event) => setMaterial(event.target.value as Material)}>
              {materialOptions.map((option) => (
                <option value={option} key={option}>
                  {materialLabels[option]}
                </option>
              ))}
            </select>
          </label>
          <div className="mini-control">
            <span>图案</span>
            <Segmented options={patternOptions} value={pattern} onChange={setPattern} label={(p) => patternLabels[p]} />
          </div>
          <div className="mini-control">
            <span>版型</span>
            <Segmented options={fitOptions} value={fit} onChange={setFit} label={(f) => fitLabels[f]} />
          </div>
          <div className="mini-control">
            <span>长度</span>
            <Segmented options={lengthOptions} value={length} onChange={setLength} label={(l) => lengthLabels[l]} />
          </div>
          <div className="rating-row rating-row--stack">
            <div className="rating-row__head">
              <b>厚薄</b>
              <small>1 很薄 · 5 很厚</small>
            </div>
            <RatingBar value={thickness} onChange={(v) => setThickness(v as Rating)} />
          </div>
        </div>
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

      <button type="submit" className="primary-button" disabled={isUploading}>
        <Save size={18} />
        {isUploading ? '图片处理中…' : '保存'}
      </button>
    </form>
  );
}
