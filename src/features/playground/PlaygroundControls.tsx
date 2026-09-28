import { useI18n } from '../../i18n';
import { Play, Copy } from 'lucide-react';
export function AlgorithmInput({
  value,
  onChange,
  onExecute,
}: {
  value: string;
  onChange: (s: string) => void;
  onExecute: () => void;
}) {
  const { t } = useI18n();
  return (
    <form
      className="algorithm-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onExecute();
      }}
    >
      <label>
        {t('Algorithm')}
        <textarea
          placeholder={t("R U R' U'")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (value.trim()) onExecute();
            }
          }}
        />
      </label>
      <button className="primary" disabled={!value.trim()}>
        <Play size={15} />
        {t('Execute algorithm')}
      </button>
    </form>
  );
}
export function MoveHistory({ moves, clear }: { moves: string[]; clear: () => void }) {
  const { t } = useI18n();
  return (
    <section className="move-history">
      <div className="section-heading">
        <span>{t('MOVE HISTORY')}</span>
        <button
          className="icon-button"
          aria-label={t('Copy move history')}
          disabled={!moves.length}
          onClick={() => void navigator.clipboard.writeText(moves.join(' '))}
        >
          <Copy size={15} />
        </button>
      </div>
      <p>{moves.join(' ') || t('Your moves appear here.')}</p>
      <button className="text-button" disabled={!moves.length} onClick={clear}>
        {t('Clear history · keep position')}
      </button>
    </section>
  );
}
