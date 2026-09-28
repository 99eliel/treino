(() => {
  'use strict';
  const VERSION = '2.3.0';
  const UPDATE_INTERVAL = 30 * 60 * 1000;
  const statusEl = () => document.getElementById('updateStatus');

  function setStatus(text, tone = 'normal') {
    const el = statusEl();
    if (!el) return;
    el.textContent = `Versão atual: ${VERSION} · ${text}`;
    if (tone === 'ok') el.style.color = 'var(--accent,#b9ff4a)';
    else if (tone === 'warn') el.style.color = 'var(--warning,#ffd166)';
    else el.style.color = 'var(--muted,#8f969e)';
  }

  async function ensureCurrentServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      setStatus('Atualização automática indisponível', 'warn');
      return null;
    }
    try {
      return await navigator.serviceWorker.register('./sw.js?v=2.3.0');
    } catch (error) {
      setStatus('Falha ao verificar', 'warn');
      console.warn('Não foi possível registrar o service worker atual:', error);
      return null;
    }
  }

  async function checkForUpdate() {
    if (!navigator.onLine) {
      setStatus('Offline', 'warn');
      return;
    }
    setStatus('Verificando…');
    if (!('serviceWorker' in navigator)) {
      setStatus('Atualização automática indisponível', 'warn');
      return;
    }
    try {
      const registration = await ensureCurrentServiceWorker() || await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setStatus('Falha ao verificar', 'warn');
        return;
      }
      await registration.update();
      if (registration.waiting) {
        setStatus('Aplicando atualização…');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }
      setStatus('Atualizado', 'ok');
    } catch (error) {
      setStatus('Falha ao verificar', 'warn');
      console.warn('Não foi possível verificar atualização do PWA:', error);
    }
  }

  window.addEventListener('load', () => setTimeout(checkForUpdate, 800));
  window.addEventListener('online', checkForUpdate);
  window.addEventListener('offline', () => setStatus('Offline', 'warn'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });
  setInterval(checkForUpdate, UPDATE_INTERVAL);

  try {
    const previous = localStorage.getItem('shape-app-version');
    localStorage.setItem('shape-app-version', VERSION);
    if (previous && previous !== VERSION) {
      window.addEventListener('load', () => setTimeout(() => {
        setStatus('Nova versão aplicada', 'ok');
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = `Shape atualizado para v${VERSION} ✓`;
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2400);
        }
        setTimeout(() => setStatus('Atualizado', 'ok'), 3200);
      }, 1100), { once:true });
    }
  } catch (_) {}
})();
