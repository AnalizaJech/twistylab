import { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useI18n } from '../i18n';
function ReloadWorkspace() {
  const { t } = useI18n();
  return (
    <div className="workspace-recovery" role="alert">
      <RefreshCw size={24} />
      <h2>{t('The workspace could not load.')}</h2>
      <p>{t('Reload to get the latest version. Your saved solves will be kept.')}</p>
      <button className="primary" onClick={() => window.location.reload()}>
        {t('Reload workspace')}
      </button>
    </div>
  );
}
export class WorkspaceBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <ReloadWorkspace /> : this.props.children;
  }
}
