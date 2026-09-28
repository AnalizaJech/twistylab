import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSessionStore } from '../stores';
import { Modal } from './Primitives';
export function SessionSelector() {
  const { sessions, sessionId, select, addSession } = useSessionStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  return (
    <div className="session-select">
      <select aria-label="Session" value={sessionId} onChange={(e) => select(e.target.value)}>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button className="icon-button" aria-label="New session" onClick={() => setOpen(true)}>
        <Plus size={16} />
      </button>
      {open && (
        <Modal title="New session" onClose={() => setOpen(false)}>
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
              Session name
              <input
                autoFocus
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Weekend practice"
              />
            </label>
            <button className="primary" type="submit">
              Create session
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
