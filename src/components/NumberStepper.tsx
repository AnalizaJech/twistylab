import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useI18n } from '../i18n';
export function NumberStepper({
  value,
  onChange,
  min,
  max,
  step,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const next = /^\d+$/.test(draft) ? Math.max(min, Math.min(max, Number(draft))) : value;
    setDraft(String(next));
    onChange(next);
  };
  return (
    <div className="number-stepper">
      <button
        type="button"
        aria-label={t('Decrease duration')}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        <Minus size={13} />
      </button>
      <input
        aria-label={t(label)}
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
      <button
        type="button"
        aria-label={t('Increase duration')}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
