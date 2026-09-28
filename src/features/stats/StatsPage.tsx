import { useState } from 'react';
import type { Solve } from '../../types';
import { average, bestSingle, effectiveTime, formatTime } from '../../core/statistics';
import { useSolves } from '../../hooks/useSolves';
import { usePuzzleStore, useSessionStore, useSettingsStore } from '../../stores';
import { SessionSelector } from '../../components/SessionSelector';
import { useBestAverages } from '../../hooks/useBestAverages';
export function StatsSummary({ solves, compact = false }: { solves: Solve[]; compact?: boolean }) {
  const p = useSettingsStore((s) => s.settings.precision);
  const best = useBestAverages(solves, !compact);
  const data: [string, number | null][] = [
    ['Ao5', average(solves, 5)],
    ['Ao12', average(solves, 12)],
    ['Best', bestSingle(solves)],
    ['Solves', solves.length],
  ];
  if (!compact)
    data.splice(
      2,
      0,
      ['Mo3', average(solves, 3, false)],
      ...[25, 50, 100].map((n) => [`Ao${n}`, average(solves, n)] as [string, number | null]),
      ['Best Ao5', best[5]],
      ['Best Ao12', best[12]],
      ['Best Ao100', best[100]],
    );
  return (
    <div className={`stats-summary ${compact ? 'compact' : ''}`}>
      {data.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{label === 'Solves' ? value : formatTime(value, p)}</strong>
        </div>
      ))}
    </div>
  );
}
export function StatsCharts({ solves }: { solves: Solve[] }) {
  const [series, setSeries] = useState('Solve time');
  const values = solves.map((s, i) =>
    series === 'Solve time'
      ? effectiveTime(s)
      : average(solves.slice(0, i + 1), Number(series.slice(2))),
  );
  const finite = values.filter((v): v is number => v !== null && Number.isFinite(v));
  const min = finite.length ? Math.max(0, Math.min(...finite) * 0.8) : 0;
  const max = finite.length ? Math.max(...finite) * 1.1 : 1000;
  const y = (v: number) => 200 - ((v - min) / (max - min || 1)) * 170;
  return (
    <section className="chart-section">
      <div className="section-heading">
        <h2>Progress over practice</h2>
        <select
          aria-label="Chart series"
          value={series}
          onChange={(e) => setSeries(e.target.value)}
        >
          {['Solve time', 'Ao5', 'Ao12', 'Ao100'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {finite.length ? (
        <svg
          viewBox="0 0 900 250"
          role="img"
          aria-label={`${series} chart across ${solves.length} solves`}
          className="chart"
        >
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <line x1="55" x2="890" y1={30 + i * 56} y2={30 + i * 56} />
              <text x="0" y={35 + i * 56}>
                {formatTime(max - ((max - min) * i) / 3)}
              </text>
            </g>
          ))}
          {values.map((v, i) =>
            v !== null && Number.isFinite(v) ? (
              <g key={i}>
                {i > 0 && values[i - 1] !== null && Number.isFinite(values[i - 1]) && (
                  <line
                    className="data-line"
                    x1={60 + ((i - 1) / Math.max(1, values.length - 1)) * 820}
                    y1={y(values[i - 1]!)}
                    x2={60 + (i / Math.max(1, values.length - 1)) * 820}
                    y2={y(v)}
                  />
                )}
                <circle cx={60 + (i / Math.max(1, values.length - 1)) * 820} cy={y(v)} r="3">
                  <title>
                    Solve {i + 1}: {formatTime(v)}
                  </title>
                </circle>
              </g>
            ) : null,
          )}
          <text x="55" y="240">
            FIRST SOLVE
          </text>
          <text x="790" y="240">
            LATEST
          </text>
        </svg>
      ) : (
        <div className="empty">Complete more solves to see this trend.</div>
      )}
    </section>
  );
}
export default function StatsPage() {
  const solves = useSolves();
  const { settings, update } = useSettingsStore();
  const { puzzleId, eventId } = usePuzzleStore();
  const all = useSessionStore((s) => s.solves).filter(
    (s) => s.puzzleId === puzzleId && s.eventId === eventId,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE BIGGER PICTURE</span>
          <h1>
            Find your rhythm<span>.</span>
          </h1>
        </div>
        <SessionSelector />
      </div>
      <div className="section-heading">
        <span>
          Session PB {formatTime(bestSingle(solves))} · All-time PB {formatTime(bestSingle(all))} ·
          Current {formatTime(solves.length ? effectiveTime(solves.at(-1)!) : null)}
        </span>
        <button onClick={() => void update({ charts: !settings.charts })}>
          {settings.charts ? 'Hide' : 'Show'} charts
        </button>
      </div>
      <StatsSummary solves={solves} />
      {settings.charts && <StatsCharts solves={solves} />}
      <p className="stats-explanation">
        Averages discard the fastest and slowest 5% of solves, rounded up. One DNF can be discarded
        in Ao5 and Ao12; two make the average DNF. +2 adds two seconds.
      </p>
    </>
  );
}
