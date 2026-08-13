// EL NOMBRE DE LA VERSIÓN ES CLAVE PARA ACTUALIZAR EN GITHUB
const CACHE_NAME = 'geo-chascomus-v11';

// Archivos básicos que queremos guardar en el celular
const urlsToCache = [
    './',
    './index.html',
    './mapa.html',
    './style.css',
    './home.css',
    './manifest.json',
    './json/main.js',
    './json/home.js',
    './json/config.js',
    './json/state.js',
    './json/ui.js',
    './json/map.js',
    './json/layers.js',
    './json/prefs.js',
    './json/basemaps.js',
    './json/measure.js',
    './json/print.js',
    './json/partidaSearch.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js'
];

// 1. INSTALACIÓN (Guarda los archivos esenciales)
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('portal-chascomus: Archivos cacheados exitosamente');
                // addAll falla si UNO solo falla; usamos add individual tolerante
                return Promise.all(
                    urlsToCache.map(u => cache.add(u).catch(err =>
                        console.warn('portal-chascomus: no se pudo cachear', u, err)
                    ))
                );
            })
    );
});

// 2. ACTIVACIÓN (Limpia cachés viejos cuando cambias la versión)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('portal-chascomus: Borrando caché antigua', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            ).then(() => self.clients.claim());
        })
    );
});

// 3. INTERCEPTOR DE RED (Estrategia: Network First, fallback to Cache)
self.addEventListener('fetch', event => {
    // Solo manejamos GET
    if (event.request.method !== 'GET') return;

    // Excluimos las peticiones a Google Apps Script para no interferir con el guardado
    if (event.request.url.includes('script.google.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Si hay internet y responde bien, guardamos una copia fresca en caché.
                // Aceptamos respuestas 'basic' (mismo origen) y 'cors' (cross-origin con CORS),
                // pero NO 'opaque' para evitar llenar la cache con respuestas inutilizables.
                if (!response || response.status !== 200 ||
                    (response.type !== 'basic' && response.type !== 'cors')) {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                // Si no hay internet (o GitHub Pages falla), sacamos la copia del caché
                return caches.match(event.request).then(cached => {
                    return cached || caches.match('./index.html');
                });
            })
    );
});
