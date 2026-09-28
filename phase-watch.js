(() => {
  'use strict';
  const END = new Date(2026, 9, 11, 23, 59, 59, 999);

  function leaveTemporaryPhaseIfNeeded() {
    if (new Date() > END && document.querySelector('[data-cardio-phase]')) {
      window.location.reload();
    }
  }

  window.addEventListener('focus', leaveTemporaryPhaseIfNeeded);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) leaveTemporaryPhaseIfNeeded();
  });
  setInterval(leaveTemporaryPhaseIfNeeded, 60 * 1000);
})();
