/* coi-serviceworker.js — OPTIONAL. Makes a static site (e.g. GitHub Pages) "cross-origin isolated" so WebAssembly can use
   several threads (the AI voice then generates speech roughly 2–4× faster).

   HOW TO ENABLE
   1. Keep this file next to index.html (same folder). Site must be served over HTTPS.
   2. In index.html, uncomment the line  <script src="coi-serviceworker.js"></script>  near the top.
   3. Open the site; it reloads ONCE. In the browser console type  crossOriginIsolated  → should say true.
   4. TEST: importing a PDF, hand-gesture scrolling and fonts. Isolation blocks any cross-origin resource that does
      not send CORS/CORP headers. If something breaks, re-comment the script line (and unregister the worker in
      the browser's site settings).
   Not needed for the speed fixes in index.html — this is an extra boost on top. */
if (typeof window === 'undefined') {
  // ── service-worker side: add the two headers that switch isolation on
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
  self.addEventListener('fetch', e => {
    const r = e.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
    e.respondWith(
      fetch(r).then(res => {
        if (res.status === 0) return res;                      // opaque response: cannot be modified
        const h = new Headers(res.headers);
        h.set('Cross-Origin-Embedder-Policy', 'require-corp');
        h.set('Cross-Origin-Opener-Policy', 'same-origin');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
      }).catch(() => Response.error())
    );
  });
} else {
  // ── page side: register the worker, reload once so it takes control
  (() => {
    if (window.crossOriginIsolated) return;
    if (!window.isSecureContext || !('serviceWorker' in navigator)) return;
    const KEY = 'coi_reloaded';
    const src = document.currentScript && document.currentScript.src;
    if (!src) return;
    navigator.serviceWorker.register(src).then(reg => {
      const go = () => {
        if (!navigator.serviceWorker.controller && !sessionStorage.getItem(KEY)) {
          sessionStorage.setItem(KEY, '1'); window.location.reload();
        }
      };
      if (reg.active) go();
      else reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (w) w.addEventListener('statechange', () => { if (w.state === 'activated') go(); });
      });
    }).catch(e => console.warn('[coi] service worker failed:', e));
  })();
}
