// 轻量的表单 / 选择控件，决定页和衣物表单共用。
interface SegmentedProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: (value: T) => string;
}

export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  return (
    <div className="segmented-grid">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`segment ${value === option ? 'is-selected' : ''}`}
          onClick={() => onChange(option)}
        >
          {label(option)}
        </button>
      ))}
    </div>
  );
}

interface ChipMultiSelectProps<T extends string> {
  options: readonly T[];
  value: T[];
  onChange: (value: T[]) => void;
  label: (value: T) => string;
  /** 可选：在 chip 前显示一个颜色点。 */
  swatch?: (value: T) => string;
  small?: boolean;
}

export function ChipMultiSelect<T extends string>({
  options,
  value,
  onChange,
  label,
  swatch,
  small,
}: ChipMultiSelectProps<T>) {
  const toggle = (option: T) =>
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);

  return (
    <div className="chip-grid">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            className={`chip ${small ? 'chip--small' : ''} ${active ? 'is-selected' : ''}`}
            aria-pressed={active}
            onClick={() => toggle(option)}
          >
            {swatch && <span className="chip-swatch" style={{ background: swatch(option) }} aria-hidden="true" />}
            {label(option)}
          </button>
        );
      })}
    </div>
  );
}

interface RatingBarProps {
  value: number;
  onChange: (value: number) => void;
}

export function RatingBar({ value, onChange }: RatingBarProps) {
  return (
    <div className="rating-bar" role="group">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`rating-dot ${n <= value ? 'is-on' : ''}`}
          aria-label={`${n} 分`}
          aria-pressed={n === value}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
