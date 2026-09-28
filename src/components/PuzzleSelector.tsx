import { useI18n } from '../i18n';
import { useState } from 'react';
import { Box, Search, Star, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { categories, getPuzzle, puzzleRegistry } from '../core/puzzles/registry';
import { usePuzzleStore, useSettingsStore } from '../stores';
import { Modal } from './Primitives';
export function PuzzleSelector() {
  const { t } = useI18n();
  const { puzzleId, select, recent } = usePuzzleStore();
  const { favorites, favorite } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState('All');
  const items = puzzleRegistry.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'All' ||
        (category === 'Favorites' && favorites.includes(p.id)) ||
        (category === 'Recent' && recent.includes(p.id)) ||
        (category === 'WCA' && p.officialWCA) ||
        category === p.category),
  );
  return (
    <>
      <button className="puzzle-select" onClick={() => setOpen(true)}>
        <Box size={18} />
        <span>{getPuzzle(puzzleId).shortName}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <Modal title={t('Choose your puzzle')} onClose={() => setOpen(false)}>
          <label className="search">
            <Search size={18} />
            <input
              autoFocus
              placeholder={t('Search puzzles…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  e.currentTarget
                    .closest('.modal')
                    ?.querySelector<HTMLElement>('.puzzle-option')
                    ?.focus();
                }
              }}
            />
          </label>
          <div className="catalog-toolbar">
            <div className="category-tabs">
              {['All', 'Favorites', 'Recent'].map((c) => (
                <button
                  key={t(c)}
                  className={category === c ? 'active' : ''}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {t(c)}
                </button>
              ))}
            </div>
            <button
              className={filtersOpen ? 'filter-button active' : 'filter-button'}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={15} />
              {t('Filters')}
              {!['All', 'Favorites', 'Recent'].includes(category) && (
                <span className="status-dot" />
              )}
            </button>
          </div>
          {filtersOpen && (
            <div className="catalog-filters">
              {categories
                .filter((c) => c === 'WCA' || puzzleRegistry.some((p) => p.category === c))
                .map((c) => (
                  <button
                    key={t(c)}
                    className={category === c ? 'active' : ''}
                    onClick={() => setCategory(category === c ? 'All' : c)}
                  >
                    {t(c)}
                    <small>
                      {
                        puzzleRegistry.filter((p) =>
                          c === 'WCA' ? p.officialWCA : p.category === c,
                        ).length
                      }
                    </small>
                  </button>
                ))}
            </div>
          )}
          <div className="catalog-count">
            {items.length} {t(items.length === 1 ? 'puzzle' : 'puzzles')}
          </div>
          <div
            className="puzzle-list"
            onKeyDown={(e) => {
              if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
              e.preventDefault();
              const buttons = Array.from(
                e.currentTarget.querySelectorAll<HTMLButtonElement>('.puzzle-option'),
              );
              const index = buttons.findIndex((button) => button === document.activeElement);
              const next =
                e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? buttons.length - 1
                    : (index + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
              buttons[next]?.focus();
            }}
          >
            {items.map((p) => (
              <div key={p.id} className={p.id === puzzleId ? 'selected' : ''}>
                <button
                  className="puzzle-option"
                  onClick={() => {
                    select(p.id);
                    setOpen(false);
                  }}
                >
                  <Box size={24} />
                  <span>
                    {p.name}
                    <small>
                      {p.officialWCA ? t('WCA · ') : ''}
                      {t(p.category)}
                    </small>
                  </span>
                </button>
                <button
                  aria-label={`${t('Favorite')} ${p.name}`}
                  aria-pressed={favorites.includes(p.id)}
                  className="icon-button"
                  onClick={() => void favorite(p.id)}
                >
                  <Star size={17} fill={favorites.includes(p.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
            {!items.length && (
              <p className="empty">{t('No available puzzles in this category.')}</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
