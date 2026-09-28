/*
 * Studio JAPI cookie-toestemming
 *
 * Niet-noodzakelijke scripts (analytics, marketing) worden NOOIT direct geladen.
 * Voeg ze toe als placeholder; ze worden pas uitgevoerd na toestemming:
 *
 *   <script type="text/plain" data-consent="analytics" src="https://..."></script>
 *   <script type="text/plain" data-consent="marketing">/* inline code *\/</script>
 *
 * Categorieen: "analytics" en "marketing". Zolang er geen placeholders op de
 * pagina staan, is er niets om toestemming voor te vragen en verschijnt de banner niet.
 * Preview van het ontwerp: voeg ?cookiebanner=preview toe aan een URL.
 */
(function () {
  'use strict';

  var KEY = 'japi_cookie_consent';
  var VERSION = 1;
  var PREVIEW = /[?&]cookiebanner=preview(&|$)/.test(location.search);
  var ORDER = ['analytics', 'marketing'];
  var LABELS = {
    analytics: { title: 'Analytisch', text: 'Helpt ons te begrijpen hoe de website wordt gebruikt, zodat we hem kunnen verbeteren.' },
    marketing: { title: 'Marketing', text: 'Helpt ons om campagnes te meten en advertenties relevanter te maken.' }
  };

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (v && v.v === VERSION && v.asked) return v;
    } catch (e) {}
    return null;
  }
  function write(prefs, asked) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, analytics: !!prefs.analytics, marketing: !!prefs.marketing, asked: asked, t: Date.now() }));
    } catch (e) {}
  }

  var holders = [].slice.call(document.querySelectorAll('script[type="text/plain"][data-consent]'));
  var present = {};
  holders.forEach(function (s) { var c = s.getAttribute('data-consent'); if (LABELS[c]) present[c] = true; });
  if (PREVIEW) present = { analytics: true, marketing: true };
  var cats = ORDER.filter(function (c) { return present[c]; });

  function activate(prefs) {
    holders.forEach(function (old) {
      var c = old.getAttribute('data-consent');
      if (!prefs[c] || old.getAttribute('data-consent-done')) return;
      old.setAttribute('data-consent-done', '1');
      var s = document.createElement('script');
      [].slice.call(old.attributes).forEach(function (a) {
        if (a.name !== 'type' && a.name !== 'data-consent' && a.name !== 'data-consent-done') s.setAttribute(a.name, a.value);
      });
      if (!old.src) s.text = old.text;
      s.async = false;
      old.parentNode.insertBefore(s, old.nextSibling);
    });
    try { document.dispatchEvent(new CustomEvent('japi:consent', { detail: prefs })); } catch (e) {}
  }

  var banner = null, overlay = null, lastFocus = null;

  function closeAll() {
    if (banner) { banner.remove(); banner = null; }
    if (overlay) { overlay.remove(); overlay = null; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  }

  function save(prefs) {
    var prev = read();
    var clean = { analytics: !!prefs.analytics && cats.indexOf('analytics') > -1, marketing: !!prefs.marketing && cats.indexOf('marketing') > -1 };
    closeAll();
    if (PREVIEW) return;
    write(clean, cats);
    var revoked = prev && ORDER.some(function (c) { return prev[c] && !clean[c]; });
    if (revoked) { location.reload(); return; }   // al geladen scripts kunnen niet worden teruggedraaid
    activate(clean);
  }

  function all(v) { var p = {}; cats.forEach(function (c) { p[c] = v; }); return p; }

  function bannerText() {
    var a = cats.indexOf('analytics') > -1, m = cats.indexOf('marketing') > -1;
    var end = a && m ? 'om te begrijpen hoe de website wordt gebruikt en om onze campagnes te meten.'
            : m ? 'om onze campagnes te meten.'
            : 'om te begrijpen hoe de website wordt gebruikt.';
    return 'We gebruiken cookies om de website goed te laten werken en, met jouw toestemming, ' + end;
  }

  function showBanner() {
    if (banner || overlay) return;
    banner = document.createElement('div');
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookies');
    banner.innerHTML =
      '<div class="cc-title">Cookies, maar dan zonder kruimels.</div>' +
      '<p class="cc-text">' + bannerText() + ' <a href="/privacy/#cookies">Lees meer</a></p>' +
      '<div class="cc-actions">' +
        '<button type="button" class="btn btn-outline cc-btn" data-cc="reject">Alles weigeren</button>' +
        '<button type="button" class="btn btn-primary cc-btn" data-cc="accept">Alles accepteren</button>' +
      '</div>' +
      '<button type="button" class="cc-link" data-cc="prefs">Voorkeuren</button>';
    banner.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cc]'); if (!t) return;
      var a = t.getAttribute('data-cc');
      if (a === 'accept') save(all(true));
      else if (a === 'reject') save(all(false));
      else if (a === 'prefs') openPrefs(t);
    });
    document.body.appendChild(banner);
  }

  function openPrefs(trigger) {
    if (overlay) return;
    lastFocus = trigger || document.activeElement;
    var stored = read() || {};
    var rows = '';
    cats.forEach(function (c) {
      var on = PREVIEW ? false : !!stored[c];
      rows += '<div class="cc-cat"><div><strong>' + LABELS[c].title + '</strong><span class="cc-desc">' + LABELS[c].text + '</span></div>' +
        '<label class="cc-switch"><input type="checkbox" data-cat="' + c + '"' + (on ? ' checked' : '') + ' aria-label="' + LABELS[c].title + '"><span class="cc-slider"></span></label></div>';
    });
    var empty = cats.length ? '' : '<p class="cc-empty">Op dit moment gebruikt studiojapi.nl geen analytische of marketingcookies. Er valt dus niets in te stellen.</p>';
    var actions = cats.length
      ? '<div class="cc-actions cc-actions-modal">' +
          '<button type="button" class="btn btn-outline cc-btn" data-cc="reject">Alles weigeren</button>' +
          '<button type="button" class="btn btn-outline cc-btn" data-cc="save">Voorkeuren opslaan</button>' +
          '<button type="button" class="btn btn-primary cc-btn" data-cc="accept">Alles accepteren</button>' +
        '</div>'
      : '<div class="cc-actions"><button type="button" class="btn btn-primary cc-btn" data-cc="close">Sluiten</button></div>';
    overlay = document.createElement('div');
    overlay.className = 'cc-overlay';
    overlay.innerHTML =
      '<div class="cc-modal" role="dialog" aria-modal="true" aria-labelledby="cc-h">' +
        '<button type="button" class="cc-close" data-cc="close" aria-label="Sluiten">&times;</button>' +
        '<div class="cc-title" id="cc-h">Cookievoorkeuren</div>' +
        '<p class="cc-text">Kies zelf wat je toestaat. Je kunt je keuze op elk moment aanpassen of intrekken via &lsquo;Cookievoorkeuren&rsquo; onderaan de website. <a href="/privacy/#cookies">Privacyverklaring</a></p>' +
        '<div class="cc-cat"><div><strong>Noodzakelijk</strong><span class="cc-desc">Nodig om de website te laten werken en je keuze te onthouden. Deze staan altijd aan.</span></div>' +
        '<label class="cc-switch"><input type="checkbox" checked disabled aria-label="Noodzakelijk"><span class="cc-slider"></span></label></div>' +
        rows + empty + actions +
      '</div>';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { closeAll(); return; }
      var t = e.target.closest('[data-cc]'); if (!t) return;
      var a = t.getAttribute('data-cc');
      if (a === 'accept') save(all(true));
      else if (a === 'reject') save(all(false));
      else if (a === 'save') {
        var p = {};
        [].slice.call(overlay.querySelectorAll('input[data-cat]')).forEach(function (i) { p[i.getAttribute('data-cat')] = i.checked; });
        save(p);
      } else if (a === 'close') closeAll();
    });
    document.body.appendChild(overlay);
    var first = overlay.querySelector('button, input:not([disabled])');
    if (first) first.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (!overlay) return;
    if (e.key === 'Escape') { closeAll(); return; }
    if (e.key === 'Tab') {
      var f = [].slice.call(overlay.querySelectorAll('button, input:not([disabled]), a[href]'));
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cookie-settings]');
    if (t) { e.preventDefault(); if (banner) { banner.remove(); banner = null; } openPrefs(t); }
  });

  // start
  var stored = read();
  if (!cats.length) return;                       // niets om toestemming voor te vragen
  if (PREVIEW) { showBanner(); return; }
  var covered = stored && cats.every(function (c) { return stored.asked.indexOf(c) > -1; });
  if (covered) activate(stored); else showBanner();
})();
