// ============================================
// SELECTOR DE MAPAS BASE (estilo visor GeoNode/MapStore)
// Panel con miniaturas para elegir el mapa de fondo.
// ============================================

import { state } from './state.js';
import { showToast } from './ui.js';
import { savePreferences } from './prefs.js';

// Tile de referencia (z/x/y) centrado en Chascomús, usado para las miniaturas
const THUMB_Z = 13, THUMB_X = 2775, THUMB_Y = 4963;

export const basemaps = [
    {
        id: 'osm',
        name: 'Callejero',
        thumb: `https://a.tile.openstreetmap.org/${THUMB_Z}/${THUMB_X}/${THUMB_Y}.png`,
        layer: () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap', maxZoom: 19
        })
    },
    {
        id: 'satellite',
        name: 'Satélite',
        thumb: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${THUMB_Z}/${THUMB_Y}/${THUMB_X}`,
        // Esri World Imagery no tiene fotos de alta resolución para Chascomús
        // más allá de zoom 17: pedir z18/19 devuelve un tile "Map data not
        // yet available" en vez de un error. maxNativeZoom hace que Leaflet
        // deje de pedir tiles pasado ese nivel y en su lugar agrande (con
        // pérdida de nitidez) el último tile real que sí existe, así se
        // puede seguir haciendo zoom sin ver el cartel gris.
        layer: () => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri', maxZoom: 19, maxNativeZoom: 17
        })
    },
    {
        id: 'topo',
        name: 'Topográfico',
        thumb: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${THUMB_Z}/${THUMB_Y}/${THUMB_X}`,
        layer: () => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri', maxZoom: 19
        })
    },
    {
        id: 'light',
        name: 'Claro',
        thumb: `https://a.basemaps.cartocdn.com/light_all/${THUMB_Z}/${THUMB_X}/${THUMB_Y}.png`,
        layer: () => L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO', maxZoom: 19, subdomains: 'abcd'
        })
    },
    {
        id: 'dark',
        name: 'Oscuro',
        thumb: `https://a.basemaps.cartocdn.com/dark_all/${THUMB_Z}/${THUMB_X}/${THUMB_Y}.png`,
        layer: () => L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO', maxZoom: 19, subdomains: 'abcd'
        })
    }
];

let activeTileLayer = null;

// ---- Inicializar capa base activa + panel ----
export function initBasemaps(map) {
    const initial = basemaps.find(b => b.id === state.currentBasemap) || basemaps[0];
    state.currentBasemap = initial.id;
    activeTileLayer = initial.layer().addTo(map);
    buildBasemapPanel(map);

    document.getElementById('basemapBtn').onclick = () => toggleBasemapPanel();

    // Cerrar panel si se clickea afuera
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('basemapPanel');
        if (!panel.classList.contains('open')) return;
        if (e.target.closest('#basemapPanel') || e.target.closest('#basemapBtn')) return;
        toggleBasemapPanel(false);
    });
}

function buildBasemapPanel(map) {
    const panel = document.getElementById('basemapPanel');
    panel.innerHTML = '';
    basemaps.forEach((b) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'basemap-card' + (b.id === state.currentBasemap ? ' active' : '');
        card.dataset.id = b.id;
        card.setAttribute('aria-label', 'Mapa base: ' + b.name);
        card.innerHTML = `<img src="${b.thumb}" alt="" loading="lazy">
            <span>${b.name}</span>`;
        card.addEventListener('click', () => switchBasemap(b.id, map));
        panel.appendChild(card);
    });
}

function switchBasemap(id, map) {
    if (id !== state.currentBasemap) {
        const def = basemaps.find((b) => b.id === id);
        if (!def) return;
        if (activeTileLayer) map.removeLayer(activeTileLayer);
        activeTileLayer = def.layer().addTo(map);
        state.currentBasemap = id;
        savePreferences();

        document.querySelectorAll('.basemap-card').forEach((c) => {
            c.classList.toggle('active', c.dataset.id === id);
        });
        showToast('🗺️ Mapa base: ' + def.name);
    }
    toggleBasemapPanel(false);
}

export function toggleBasemapPanel(force) {
    // El botón "Cambiar mapa base" vive ahora dentro del menú desplegable
    // de herramientas del header; el panel de miniaturas se ancla en un
    // lugar fijo (esquina superior derecha, debajo del header) vía CSS,
    // en vez de calcularse en base a la posición del botón.
    const panel = document.getElementById('basemapPanel');
    const willOpen = force !== undefined ? force : !panel.classList.contains('open');
    panel.classList.toggle('open', willOpen);
}
