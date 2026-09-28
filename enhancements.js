(() => {
  'use strict';
  const VERSION = '2.4.0';
  const UPDATE_INTERVAL = 30 * 60 * 1000;
  const statusEl = () => document.getElementById('updateStatus');
  let checking = false;

  function setStatus(text, tone = 'normal') {
    const el = statusEl();
    if (!el) return;
    el.textContent = `Versão atual: ${VERSION} · ${text}`;
    if (tone === 'ok') el.style.color = 'var(--accent,#b9ff4a)';
    else if (tone === 'warn') el.style.color = 'var(--warning,#ffd166)';
    else el.style.color = 'var(--muted,#8f969e)';
  }

  async function checkForUpdate() {
    if (checking) return;
    if (!navigator.onLine) {
      setStatus('Offline', 'warn');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      setStatus('Atualização automática indisponível', 'warn');
      return;
    }

    checking = true;
    setStatus('Verificando…');

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        setStatus('Inicializando…');
        checking = false;
        setTimeout(checkForUpdate, 1800);
        return;
      }

      await registration.update();

      if (registration.waiting) {
        setStatus('Aplicando atualização…');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        checking = false;
        return;
      }

      setStatus('Atualizado', 'ok');
    } catch (error) {
      setStatus('Falha ao verificar', 'warn');
      console.warn('Não foi possível verificar atualização do PWA:', error);
    } finally {
      checking = false;
    }
  }

  window.addEventListener('load', () => setTimeout(checkForUpdate, 1200));
  window.addEventListener('online', checkForUpdate);
  window.addEventListener('offline', () => setStatus('Offline', 'warn'));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdate();
  });
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
      }, 1500), { once:true });
    }
  } catch (_) {}
})();
