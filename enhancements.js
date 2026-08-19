(() => {
  'use strict';

  const VERSION = '1.1.0';
  const UPDATE_INTERVAL = 30 * 60 * 1000;
  const app = document.getElementById('app');

  function applyWednesdayGuide() {
    if (new Date().getDay() !== 3 || !app) return;

    const heroTitle = app.querySelector('.hero-card h2');
    if (heroTitle && heroTitle.textContent.trim() === 'Cardio / recuperação') {
      heroTitle.textContent = 'Somente cardio — sem musculação';
      const heroSub = heroTitle.parentElement?.querySelector('.hero-sub');
      if (heroSub) heroSub.textContent = 'Recuperação ativa entre a perna de terça e o treino de quinta.';
    }

    const labels = [...app.querySelectorAll('.check-label')];
    const cardioLabel = labels.find(el => el.textContent.trim() === 'Cardio / recuperação');
    if (!cardioLabel) return;

    cardioLabel.textContent = 'Somente cardio — sem musculação';
    const row = cardioLabel.closest('.check-row');
    const meta = row?.querySelector('.check-meta');
    if (meta) meta.textContent = 'Esteira 30–40 min · 5–6,5 km/h · inclinação 4–6%';

    const card = row?.closest('.card');
    const section = card?.closest('.section');
    if (section && !section.querySelector('#wednesdayCardioGuide')) {
      const guide = document.createElement('div');
      guide.id = 'wednesdayCardioGuide';
      guide.className = 'note';
      guide.style.marginTop = '10px';
      guide.innerHTML = '<b>Como fazer hoje:</b><br>Esteira por <b>30–40 min</b>, velocidade de <b>5 a 6,5 km/h</b> e inclinação inicial de <b>4–6%</b>. Se estiver confortável, pode subir aos poucos até <b>8–10%</b>.<br><br><b>Se a perna estiver cansada:</b> bicicleta ou elíptico por 30–40 min, ou caminhada por 40–50 min.<br><br><b>Intensidade:</b> respiração mais forte e suor, mas ainda conseguindo conversar. Sem HIIT e sem musculação hoje.';
      section.appendChild(guide);
    }
  }

  function applyVersionLabel() {
    if (!app) return;
    [...app.querySelectorAll('.section-head p')].forEach(el => {
      if (/^v\d+\.\d+\.\d+$/.test(el.textContent.trim())) el.textContent = `v${VERSION}`;
    });
  }

  let scheduled = false;
  function refreshEnhancements() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyWednesdayGuide();
      applyVersionLabel();
    });
  }

  if (app) {
    new MutationObserver(refreshEnhancements).observe(app, { childList: true, subtree: true });
    refreshEnhancements();
  }

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

  window.addEventListener('load', () => setTimeout(checkForUpdate, 1200));
  window.addEventListener('online', checkForUpdate);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdate();
  });
  setInterval(checkForUpdate, UPDATE_INTERVAL);

  try {
    const previousVersion = localStorage.getItem('shape-app-version');
    localStorage.setItem('shape-app-version', VERSION);
    if (previousVersion && previousVersion !== VERSION) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const toast = document.getElementById('toast');
          if (!toast) return;
          toast.textContent = `Shape atualizado para v${VERSION} ✓`;
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 2200);
        }, 1600);
      }, { once: true });
    }
  } catch (_) {
    // localStorage indisponível: o app continua funcionando normalmente.
  }
})();
