import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useI18n } from '../i18n';

const ConfirmationContext = createContext<(message: string) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmationContext);
export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const resolve = useRef<((value: boolean) => void) | null>(null);
  function close(value: boolean) {
    resolve.current?.(value);
    resolve.current = null;
    setMessage('');
  }
  return (
    <ConfirmationContext.Provider
      value={(text) =>
        new Promise<boolean>((done) => {
          resolve.current?.(false);
          resolve.current = done;
          setMessage(text);
        })
      }
    >
      {children}
      <AlertDialog.Root
        open={Boolean(message)}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="confirm-backdrop" />
          <AlertDialog.Content className="confirm-dialog">
            <AlertDialog.Title>{t('Confirm action')}</AlertDialog.Title>
            <AlertDialog.Description>{t(message)}</AlertDialog.Description>
            <div className="button-row">
              <AlertDialog.Cancel asChild>
                <button onClick={() => close(false)}>{t('Cancel')}</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button className="primary" onClick={() => close(true)}>
                  {t('Confirm')}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmationContext.Provider>
  );
}
