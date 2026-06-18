import { Footprints, Shirt, ShoppingBag, Sparkles } from 'lucide-react';
import { ClothingItem } from '../types';
import { colorHex, getColor } from '../lib/clothingOptions';

interface ClothingVisualProps {
  item: ClothingItem;
  className?: string;
}

const iconFor = (category: ClothingItem['category']) => {
  if (category === 'shoes') return Footprints;
  if (category === 'bag') return ShoppingBag;
  if (category === 'accessory') return Sparkles;
  return Shirt;
};

export function ClothingVisual({ item, className = '' }: ClothingVisualProps) {
  const isPattern = getColor(item.color).pattern || item.pattern !== 'solid';
  const Icon = iconFor(item.category);
  const classes = `clothing-visual ${isPattern ? 'is-pattern' : ''} ${className}`.trim();

  if (item.imageThumb) {
    return (
      <span className={`${classes} has-photo`} aria-hidden="true">
        <img src={item.imageThumb} alt="" />
      </span>
    );
  }

  return (
    <span className={classes} style={{ background: colorHex(item.color) }} aria-hidden="true">
      <Icon size={18} strokeWidth={1.8} />
    </span>
  );
}
