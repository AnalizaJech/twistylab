import { useState } from 'react';
import { Box, Search, Star, ChevronDown } from 'lucide-react';
import { categories, getPuzzle, puzzleRegistry } from '../core/puzzles/registry';
import { usePuzzleStore, useSettingsStore } from '../stores';
import { Modal } from './Primitives';
export function PuzzleSelector() {
  const { puzzleId, select, recent } = usePuzzleStore();
  const { favorites, favorite } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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
        <Modal title="Choose your puzzle" onClose={() => setOpen(false)}>
          <label className="search">
            <Search size={18} />
            <input
              autoFocus
              placeholder="Search puzzles…"
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
          <div className="category-tabs">
            {['All', 'Favorites', 'Recent', ...categories].map((c) => (
              <button
                key={c}
                className={category === c ? 'active' : ''}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
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
                      {p.officialWCA ? 'WCA · ' : ''}
                      {p.category}
                    </small>
                  </span>
                </button>
                <button
                  aria-label={`Favorite ${p.name}`}
                  aria-pressed={favorites.includes(p.id)}
                  className="icon-button"
                  onClick={() => void favorite(p.id)}
                >
                  <Star size={17} fill={favorites.includes(p.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
            {!items.length && <p className="empty">No available puzzles in this category.</p>}
          </div>
        </Modal>
      )}
    </>
  );
}
