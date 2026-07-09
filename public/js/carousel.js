// Team carousel arrows. Plain vanilla JS served as a static file so it stays an
// external 'self' script (no inline JS → strict `script-src 'self'` CSP holds).
// Runs both on first load and after every View Transition navigation, so the
// arrows keep working when the page is swapped in client-side.
(function () {
  function init() {
    document.querySelectorAll('[data-carousel]').forEach(function (root) {
      // Idempotent: skip carousels we've already wired (e.g. on a transition
      // that swaps page content without replacing these nodes).
      if (root.dataset.carouselReady === '1') return;
      root.dataset.carouselReady = '1';

      var track = root.querySelector('[data-carousel-track]');
      if (!track) return;
      var step = function () {
        return Math.max(track.clientWidth * 0.8, 240);
      };
      var prev = root.querySelector('[data-carousel-prev]');
      var next = root.querySelector('[data-carousel-next]');
      if (prev)
        prev.addEventListener('click', function () {
          track.scrollBy({ left: -step(), behavior: 'smooth' });
        });
      if (next)
        next.addEventListener('click', function () {
          track.scrollBy({ left: step(), behavior: 'smooth' });
        });
    });
  }

  // Initial load (defer keeps the DOM ready) + View Transitions swaps.
  init();
  document.addEventListener('astro:page-load', init);
})();
