// ============================================
// INICIALIZACIÓN Y HELPERS DEL MAPA
// ============================================

import { CHASCOMUS_CENTER, DEFAULT_ZOOM, layersConfig } from './config.js';
import { state } from './state.js';
import { showToast, cerrarPanel } from './ui.js';

// ---- Color según estado de habilitación ----
export function getStatusColor(estado) {
    const s = (estado || '').toUpperCase();
    if (s === 'VIGENTE')   return '#2fc96f';
    if (s === 'VENCIDA')   return '#c74031';
    if (s === 'SIN FECHA') return '#c6742c';
    return '#2b8ccd';
}

// ---- Marcador personalizado con emoji ----
// colorOverride: si se pasa, se usa ese color fijo en vez de derivarlo del estado
// (vigente/vencida). Lo usan, por ejemplo, las capas de rubros.
export function createCustomMarker(latlng, estado, emoji, colorOverride) {
    const color = colorOverride || getStatusColor(estado);
    const contenido = emoji
        ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:14px;">${emoji}</div>`
        : '';

    return L.marker(latlng, {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:34px;height:34px;position:relative;">
                <svg viewBox="0 0 34 34" style="width:100%;height:100%;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.2));">
                    <circle cx="17" cy="17" r="15" fill="${color}" stroke="white" stroke-width="2.5"/>
                </svg>
                ${contenido}
            </div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -17]
        })
    });
}

// ---- Grupos de capas (cluster o plano) ----
export function createLayerGroup(useCluster = true) {
    if (useCluster) {
        return L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            iconCreateFunction(cluster) {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div style="background:#0b6c36;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;font-size:12px;">${count}</div>`,
                    iconSize: L.point(32, 32)
                });
            }
        });
    }
    return L.layerGroup();
}

export function getOrCreateLayerGroup(key) {
    if (!state.layerGroups[key]) {
        state.layerGroups[key] = createLayerGroup(layersConfig[key].useCluster);
    }
    return state.layerGroups[key];
}

// ---- Inicializar mapa Leaflet ----
// Nota: el mapa base (basemap) se gestiona aparte en basemaps.js (panel con miniaturas)
export function initMap() {
    state.map = L.map('map', {
        center: CHASCOMUS_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false
    });

    // Zoom buttons
    document.getElementById('zoomInBtn').onclick  = () => state.map.zoomIn();
    document.getElementById('zoomOutBtn').onclick = () => state.map.zoomOut();

    // GPS con manejo de errores detallado
    let gpsMarker = null;

    document.getElementById('gpsBtn').onclick = () => {
        state.map.locate({ setView: true, maxZoom: 16 });
        showToast('🔍 Buscando ubicación...');
    };

    state.map.on('locationfound', (e) => {
        if (gpsMarker) state.map.removeLayer(gpsMarker);
        gpsMarker = L.circleMarker(e.latlng, {
            radius: 8, fillColor: '#b8d30f', color: '#1a2a4f', weight: 2, fillOpacity: 0.9
        }).addTo(state.map).bindPopup('📍 Tu ubicación').openPopup();
        showToast('✅ Ubicación encontrada');
    });

    state.map.on('locationerror', (e) => {
        // e.code: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        let msg;
        switch (e.code) {
            case 1:
                msg = '🔒 Permiso de ubicación denegado. Habilitalo en la configuración del navegador.';
                break;
            case 2:
                msg = '📡 No se pudo determinar la ubicación. Verificá la señal GPS.';
                break;
            case 3:
                msg = '⏱️ Tiempo de espera agotado al buscar ubicación.';
                break;
            default:
                msg = '❌ No se pudo obtener la ubicación.';
        }
        showToast(msg, 5000);
    });

    // Cerrar panel al interactuar con el mapa
    state.map.on('click',    () => cerrarPanel());
    state.map.on('zoomend',  () => cerrarPanel());
    state.map.on('dragstart',() => cerrarPanel());
}
