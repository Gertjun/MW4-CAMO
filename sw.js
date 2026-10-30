// Service worker: maakt de app offline bruikbaar en regelt updates.
//
// BIJ ELKE RELEASE: VERSION ophogen (gelijk aan js/config.js).
// NIEUW BESTAND?    Toevoegen aan PRECACHE.

const VERSION = '1.5.0';

// De cache-naam bevat het pad van de app, zodat meerdere apps onder
// <gebruiker>.github.io elkaars cache niet opruimen.
const SCOPE = new URL(self.registration.scope).pathname;
const CACHE_PREFIX = `shell:${SCOPE}:`;
const CACHE = `${CACHE_PREFIX}${VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/app.css',
  './js/main.js',
  './js/config.js',
  './js/app.js',
  './js/catalog.js',
  './js/loadouts.js',
  './img/camos/brown.webp',
  './img/camos/gunmetal.webp',
  './img/camos/dark-tan.webp',
  './img/camos/lime.webp',
  './img/camos/garland.webp',
  './img/camos/shed.webp',
  './img/camos/grazer.webp',
  './img/camos/ice-storm.webp',
  './img/camos/dapple-cast.webp',
  './img/camos/indexed.webp',
  './img/camos/groundcover.webp',
  './img/camos/mosswood.webp',
  './img/camos/mausoleum.webp',
  './img/camos/smoke.webp',
  './img/camos/stormwave.webp',
  './img/camos/red.webp',
  './img/camos/gold.webp',
  './img/camos/platinum.webp',
  './img/camos/harmonic-break.webp',
  './img/camos/myriad.webp',
  './img/camos/night-ops.webp',
  './img/camos/green.webp',
  './img/camos/ponderosa.webp',
  './img/camos/red-rain.webp',
  './img/camos/kitty-kaos.webp',
  './img/camos/dune-sea.webp',
  './img/camos/scorch.webp',
  './img/camos/disperse.webp',
  './img/camos/samnim.webp',
  './img/camos/raster-aux.webp',
  './img/camos/yellow.webp',
  './img/camos/dark-moss.webp',
  './img/camos/shale.webp',
  './img/camos/hot-rod.webp',
  './img/camos/splinter-rock.webp',
  './img/camos/sunset-tropic.webp',
  './img/camos/cyan.webp',
  './img/camos/oni.webp',
  './img/camos/urban-smoke.webp',
  './img/camos/optical-reverb.webp',
  './img/camos/asphalt.webp',
  './img/camos/black-topo.webp',
  './img/camos/jungle-shadow.webp',
  './img/camos/ghast.webp',
  './img/camos/stellation.webp',
  './img/camos/rattlesnake.webp',
  './img/camos/blackwell.webp',
  './img/camos/iron.webp',
  './img/camos/currents.webp',
  './img/camos/sniper-veil.webp',
  './img/camos/carbonated.webp',
  './img/camos/struck-oil.webp',
  './img/camos/brushstroke.webp',
  './img/camos/white-pine.webp',
  './img/camos/redshift.webp',
  './img/camos/corrupted-clay.webp',
  './img/camos/magma-ire.webp',
  './img/camos/desert-tactics.webp',
  './img/camos/green-tiger.webp',
  './img/camos/thunderhead.webp',
  './img/camos/ash-pine.webp',
  './img/camos/outcrop.webp',
  './img/camos/foxtrail.webp',
  './img/camos/phantom-flux.webp',
  './img/camos/mineral.webp',
  './img/camos/tiger-swipe.webp',
  './img/camos/mangrove.webp',
  './img/camos/fungal-grid.webp',
  './img/camos/white.webp',
  './img/camos/hibiscus.webp',
  './img/camos/fire-topo.webp',
  './img/camos/deep-space.webp',
  './img/camos/ice-sheer.webp',
  './img/camos/fractal-snow.webp',
  './img/camos/sticker-shock.webp',
  './img/camos/treeline.webp',
  './img/camos/spidersilk.webp',
  './img/camos/tension.webp',
  './img/camos/dry-brush.webp',
  './img/camos/backcountry.webp',
  './img/camos/dread-plague.webp',
  './img/camos/anaconda.webp',
  './img/camos/ripplewave.webp',
  './img/camos/sunburn.webp',
  './img/camos/autumn.webp',
  './img/camos/snakeskin.webp',
  './img/camos/space-time.webp',
  './img/camos/off-grid.webp',
  './img/camos/urban-flamingo.webp',
  './img/camos/smokescreen.webp',
  './img/camos/frosted.webp',
  './img/camos/splatter-ops.webp',
  './img/camos/red-tiger.webp',
  './img/camos/miami.webp',
  './img/camos/wallpaper.webp',
  './img/camos/frontier.webp',
  './img/camos/sandwash.webp',
  './img/camos/digital-fall.webp',
  './img/camos/digi-bark.webp',
  './img/camos/stone-bits.webp',
  './img/camos/bubblegum-ops.webp',
  './img/camos/thicket.webp',
  './img/camos/tectonic.webp',
  './img/camos/blue-tiger.webp',
  './img/camos/night-snow.webp',
  './img/camos/recursive.webp',
  './img/camos/urban-standard.webp',
  './img/camos/raster-lite.webp',
  './img/camos/stockpile.webp',
  './img/camos/deathbed.webp',
  './img/weapons/50-gs.webp',
  './img/weapons/apoc-338.webp',
  './img/weapons/astaroth-57.webp',
  './img/weapons/axion.webp',
  './img/weapons/cronen-squall.webp',
  './img/weapons/finn-lmg.webp',
  './img/weapons/fss-carbon-edge-1095.webp',
  './img/weapons/han-86.webp',
  './img/weapons/hyeon-burst.webp',
  './img/weapons/iso-nightshade.webp',
  './img/weapons/jokr.webp',
  './img/weapons/kastov-762.webp',
  './img/weapons/kg-7-vulcan.webp',
  './img/weapons/krait-p68.webp',
  './img/weapons/m4.webp',
  './img/weapons/mar-9.webp',
  './img/weapons/mojave-357.webp',
  './img/weapons/mosin-nagant.webp',
  './img/weapons/oden.webp',
  './img/weapons/oris-8-6.webp',
  './img/weapons/patriot-xmr.webp',
  './img/weapons/pila.webp',
  './img/weapons/pm-40-anvil.webp',
  './img/weapons/ppsh-41.webp',
  './img/weapons/rezi-12.webp',
  './img/weapons/rpg-8.webp',
  './img/weapons/sang-9mm.webp',
  './img/weapons/signal-50.webp',
  './img/weapons/type-73.webp',
  './img/weapons/vel-46.webp',
  './img/weapons/warlord.webp',
  './img/weapons/wz-55-striga.webp',
  './img/weapons/x-58-nyx.webp',
  './js/core/shell.js',
  './js/core/vault.js',
  './js/core/crypto.js',
  './js/core/biometric.js',
  './js/core/github.js',
  './js/core/sync.js',
  './js/core/records.js',
  './js/core/dom.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))),
  );
  // Geen skipWaiting(): de gebruiker kiest zelf "Bijwerken" (zie shell.js).
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  // Laat de app controleren of de versienummers gelijk zijn.
  if (event.data?.type === 'GET_VERSION') event.source?.postMessage({ type: 'VERSION', version: VERSION });
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Alleen eigen bestanden uit de cache; GitHub-API en andere domeinen altijd via het netwerk.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match('./index.html', { cacheName: CACHE });
      return cached || fetch(request);
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, { cacheName: CACHE, ignoreSearch: true });
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && url.pathname.startsWith(SCOPE)) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  })());
});
