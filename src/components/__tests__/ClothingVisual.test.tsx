import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ClothingVisual } from '../ClothingVisual';
import { normalizeClothing } from '../../lib/storage';

describe('ClothingVisual', () => {
  it('缺图片时仍然渲染颜色和分类图标兜底 UI', () => {
    const item = normalizeClothing({
      id: 'no-image',
      name: '白色短袖',
      category: 'top',
      color: 'white',
      styleTags: [],
      warmth: 2,
      comfort: 4,
      formality: 2,
      versatility: 4,
      suitableSeasons: ['summer'],
      suitableOccasions: ['casual'],
      isClean: true,
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });

    const html = renderToStaticMarkup(<ClothingVisual item={item} />);
    expect(html).toContain('clothing-visual');
    expect(html).not.toContain('<img');
    expect(html).toContain('svg');
  });
});
