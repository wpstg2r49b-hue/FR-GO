/* coi-serviceworker.js — CLEAN-UP VERSION.
   An earlier build of Focus Reader registered a service worker from this file (it was only needed for the old
   Kokoro voice). The Piper voice does not need it. This version removes itself: once the browser updates it, it
   unregisters and reloads the open page. You can keep this file in the repository or delete it; index.html also
   unregisters any old service worker on load. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  await self.registration.unregister();
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(c => { try { c.navigate(c.url); } catch (err) {} });
})()));
