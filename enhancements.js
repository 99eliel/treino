(() => {
  'use strict';
  const VERSION = '2.1.0';
  const UPDATE_INTERVAL = 30 * 60 * 1000;

  async function checkForUpdate() {
    if (!('serviceWorker' in navigator) || !navigator.onLine) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      await registration.update();
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch (error) {
      console.warn('Não foi possível verificar atualização do PWA:', error);
    }
  }

  window.addEventListener('load', () => setTimeout(checkForUpdate, 1000));
  window.addEventListener('online', checkForUpdate);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });
  setInterval(checkForUpdate, UPDATE_INTERVAL);

  try {
    const previous = localStorage.getItem('shape-app-version');
    localStorage.setItem('shape-app-version', VERSION);
    if (previous && previous !== VERSION) {
      window.addEventListener('load', () => setTimeout(() => {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = `Shape atualizado para v${VERSION} ✓`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2400);
      }, 1400), { once:true });
    }
  } catch (_) {}
})();
