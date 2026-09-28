import { useI18n } from '../i18n';
import { Select } from './Select';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSessionStore } from '../stores';
import { Modal } from './Primitives';
export function SessionSelector() {
  const { t } = useI18n();
  const { sessions, sessionId, select, addSession } = useSessionStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  return (
    <div className="session-select">
      <Select
        label={t('Session')}
        value={sessionId}
        onValueChange={select}
        options={sessions.map((s) => ({ value: s.id, label: s.name }))}
      />
      <button className="icon-button" aria-label={t('New session')} onClick={() => setOpen(true)}>
        <Plus size={16} />
      </button>
      {open && (
        <Modal title={t('New session')} onClose={() => setOpen(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (name.trim()) {
                await addSession(name.trim());
                setName('');
                setOpen(false);
              }
            }}
          >
            <label>
              {t('Session name')}
              <input
                autoFocus
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('Weekend practice')}
              />
            </label>
            <button className="primary" type="submit">
              {t('Create session')}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
