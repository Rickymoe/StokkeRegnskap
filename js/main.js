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

// Cacher header/footer i sessionStorage. Første sidevisning i en økt henter
// og lagrer; alle senere navigasjoner injiserer synkront fra cache, så
// headeren rekker ikke å blinke tomt før fetch-en fyller den (og siden
// hopper ikke, jf. #site-header min-height). Cachen revalideres i bakgrunnen.
// outerHTML (ikke innerHTML): placeholder-diven skal ikke bli en wrapper
// rundt <nav> – en wrapper med nøyaktig navens høyde gir position: sticky
// ingen plass å feste seg i.
function loadPartial(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return Promise.resolve();
  const key = 'rsks-partial:' + url;

  let cached = null;
  try { cached = sessionStorage.getItem(key); } catch (e) {}

  const fetchAndStore = () => fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(html => {
      try { sessionStorage.setItem(key, html); } catch (e) {}
      return html;
    });

  if (cached) {
    target.outerHTML = cached;
    fetchAndStore().catch(() => {});
    return Promise.resolve();
  }

  return fetchAndStore()
    .then(html => {
      const t = document.getElementById(targetId);
      if (t) t.outerHTML = html;
    })
    .catch(err => console.error('Kunne ikke laste ' + url, err));
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
