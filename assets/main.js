// CURSOR — dot instant, ring lightly follows
// De paarse cursor en het verbergen van de systeemcursor worden hier bewust
// NIET meer via CSS media-features (any-hover/any-pointer) geregeld: die
// features worden door sommige browsers/apparaten opnieuw berekend zodra de
// muis stilstaat of er geklikt wordt, waardoor de systeemcursor even
// terugflikkert. In plaats daarvan zet JS, puur op basis van een écht
// gedetecteerde muisbeweging (pointerType === 'mouse'), een klasse op <html>.
// Die klasse blijft staan (ook bij stilstand of een klik) totdat er
// daadwerkelijk met een vinger/pen wordt aangeraakt.

const cursor = document.getElementById('cursor');

const follower = document.getElementById('cursorFollower');

const htmlEl = document.documentElement;

let mx = 0, my = 0, fx = 0, fy = 0;

let pointerEventsSupported = 'PointerEvent' in window;

function activateCursor(x, y) {

  if (window.innerWidth <= 768) return;

  if (!htmlEl.classList.contains('has-mouse')) htmlEl.classList.add('has-mouse');

  mx = x; my = y;

  cursor.style.transform = `translate(${mx - 5}px, ${my - 5}px)`;

}

if (pointerEventsSupported) {

  window.addEventListener('pointermove', e => {

    if (e.pointerType && e.pointerType !== 'mouse') return;

    activateCursor(e.clientX, e.clientY);

  }, { passive: true });

  window.addEventListener('pointerdown', e => {

    if (e.pointerType === 'touch' || e.pointerType === 'pen') {

      htmlEl.classList.remove('has-mouse');

    }

  }, { passive: true });

} else {

  // Zeer oude browsers zonder Pointer Events: val terug op mousemove.

  window.addEventListener('mousemove', e => {

    activateCursor(e.clientX, e.clientY);

  }, { passive: true });

}

window.addEventListener('resize', () => {

  if (window.innerWidth <= 768) htmlEl.classList.remove('has-mouse');

});

(function tick() {

  fx += (mx - fx - 16) * 0.18;

  fy += (my - fy - 16) * 0.18;

  follower.style.transform = `translate(${fx}px, ${fy}px)`;

  requestAnimationFrame(tick);

})();

// HEADER

const header = document.getElementById('mainHeader');

window.addEventListener('scroll', () => {

  header.classList.toggle('scrolled', window.scrollY > 40);

}, {passive: true});

// MOBILE MENU

const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');

menuToggle.addEventListener('click', () => {
  const isOpen = mobileNav.classList.contains('open');
  if (isOpen) {
    closeMobileMenu();
  } else {
    mobileNav.classList.add('open');
    menuToggle.classList.add('open');
  }
});

function closeMobileMenu() {
  mobileNav.classList.remove('open');
  menuToggle.classList.remove('open');
}

// SCROLL REVEAL

function initReveal() {

  const selectors = '.reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible), .reveal-scale:not(.visible)';

  const els = document.querySelectorAll(selectors);

  const obs = new IntersectionObserver(entries => {

    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });

  }, {threshold: 0.08, rootMargin: '0px 0px -40px 0px'});

  els.forEach(el => obs.observe(el));

  // Immediately show above-fold elements
  const allReveal = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
  document.querySelectorAll(allReveal).forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) el.classList.add('visible');
  });

}

initReveal();

// ── CARD TILT micro-interaction (subtle, desktop only) ──
if (window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.pricing-card, .why-block, .case-full-img-wrap').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-4px)`;
      card.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';
      card.style.boxShadow = `${-x * 12}px ${y * 12}px 32px rgba(0,0,0,0.12)`;
    });
    card.addEventListener('mouseleave', function() {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
      card.style.boxShadow = '';
    });
  });
}

// ── CONTACTFORMULIER via Formspree AJAX ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Bezig met versturen...';
    btn.disabled = true;
    try {
      const response = await fetch('https://formspree.io/f/xrejljke', {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        window.location.href = '/bedankt/';
      } else {
        btn.textContent = 'Er ging iets mis. Probeer opnieuw.';
        btn.disabled = false;
        setTimeout(() => { btn.textContent = originalText; }, 3000);
      }
    } catch(err) {
      btn.textContent = 'Er ging iets mis. Probeer opnieuw.';
      btn.disabled = false;
      setTimeout(() => { btn.textContent = originalText; }, 3000);
    }
  });
}

// Formulier wordt verwerkt via Formspree
