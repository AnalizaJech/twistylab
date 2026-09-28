/** Existing installs activate updates without retaining incompatible worker chunks. */
export function watchAppUpdates() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  let controlled = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) window.location.reload();
    controlled = true;
  });
  navigator.serviceWorker.ready
    .then((registration) => {
      void registration.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update().catch(() => {});
      });
    })
    .catch(() => {});
}
