const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadPartial('partials/header.html', 'site-header'),
    loadPartial('partials/footer.html', 'site-footer')
  ]);
  initNav();
  initReveal();
  initCounters();
  initDividers();
});

async function loadPartial(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    const res = await fetch(url);
    // outerHTML (not innerHTML) so the placeholder div doesn't wrap the
    // result — a wrapper exactly the height of .nav leaves position:sticky
    // with no room to stick, so .nav must become a direct child of body.
    target.outerHTML = await res.text();
  } catch (err) {
    console.error('Kunne ikke laste ' + url, err);
  }
}

function initNav() {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll('.nav a[data-page]').forEach(link => {
    if (link.dataset.page === currentPage) link.classList.add('active');
  });
  const hamburger = document.querySelector('.nav-hamburger');
  const links = document.querySelector('.nav-links');
  if (hamburger && links) {
    hamburger.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }
}

function initCounters() {
  const els = document.querySelectorAll('.stat-card .num');
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) return;   // tallene står ferdig i markup
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const text = el.textContent;
      const start = performance.now();
      const duration = 1200;
      (function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = text.replace(/\d+/g, n => Math.round(+n * p));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }, { threshold: 0.4 });
  els.forEach(el => io.observe(el));
}

function initDividers() {
  const els = document.querySelectorAll('.divider-wrap');
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('drawn'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('drawn');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  els.forEach(el => io.observe(el));
}

function initReveal() {
  window.__revealReady = true;
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');   // stagger via transition-delay i markup, ikke setTimeout
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}
