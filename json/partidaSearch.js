// ============================================
// BUSCADOR DE N° DE PARTIDA (sección Territorio)
// Busca el número de partida en las capas Parcelas Urbanizadas y
// Parcelas Rurales (únicas capas con el campo PARTIDA), activa la capa
// correspondiente si hace falta y resalta el polígono encontrado.
//
// Nota: Subparcelas, Fracciones, Chacras y Quintas no tienen número de
// partida propio (usan Circ./Secc./Chacra/Quinta/Fracción), por lo que
// quedan fuera de esta búsqueda.
// ============================================

import { layersConfig } from './config.js';
import { state } from './state.js';
import { showToast, escapeHtml } from './ui.js';
import { loadLayer, ensureLayerActive } from './layers.js';

const PARTIDA_LAYERS = ['parcelas_urbanizadas', 'parcelas_rural'];

let highlightLayer = null;

export function initPartidaSearch() {
    const input = document.getElementById('partidaSearchInput');
    const btn = document.getElementById('partidaSearchBtn');
    const status = document.getElementById('partidaSearchStatus');
    if (!input || !btn || !status) return;

    const runSearch = () => searchPartida(input, status);

    btn.addEventListener('click', runSearch);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runSearch();
        }
    });
    input.addEventListener('input', () => {
        if (!input.value.trim()) setStatus(status, '', '');
    });
}

async function searchPartida(input, status) {
    const raw = input.value.trim();
    if (!raw) {
        setStatus(status, 'Ingresá un número de partida.', 'warn');
        return;
    }

    const numero = parseInt(raw.replace(/\D/g, ''), 10);
    if (Number.isNaN(numero)) {
        setStatus(status, 'Número de partida inválido.', 'error');
        return;
    }

    setStatus(status, '<i class="fas fa-spinner fa-spin"></i> Buscando partida...', 'loading');

    try {
        // Cargar los datos de ambas capas si todavía no están en memoria
        // (sin activarlas en el mapa hasta confirmar en cuál está la partida)
        await Promise.all(PARTIDA_LAYERS.map((key) => {
            if (!state.layerData[key]) return loadLayer(key, layersConfig[key]);
            return Promise.resolve();
        }));

        for (const key of PARTIDA_LAYERS) {
            const data = state.layerData[key];
            const feature = data?.features?.find((f) => f.properties?.PARTIDA != null && Number(f.properties.PARTIDA) === numero);
            if (feature) {
                await ensureLayerActive(key);
                highlightFeature(feature, key);
                const nombreCapa = layersConfig[key]?.name || key;
                setStatus(status, `Partida ${numero} encontrada en ${escapeHtml(nombreCapa)}.`, 'success');
                showToast(`✅ Partida ${numero} localizada`, 3000);
                return;
            }
        }

        clearHighlight();
        setStatus(status, `No se encontró la partida ${numero} en Parcelas Urbanizadas ni Rurales.`, 'error');
        showToast('⚠️ Partida no encontrada', 3500);
    } catch (error) {
        console.error('Error buscando partida:', error);
        setStatus(status, 'Ocurrió un error al buscar la partida.', 'error');
        showToast('⚠️ Error al buscar partida', 4000);
    }
}

function highlightFeature(feature, layerKey) {
    clearHighlight();

    highlightLayer = L.geoJSON(feature, {
        style: {
            color: '#ffea00',
            weight: 4,
            opacity: 1,
            fillColor: '#ffea00',
            fillOpacity: 0.35
        }
    }).addTo(state.map);

    const props = feature.properties || {};
    const partida = props.PARTIDA ?? '';
    const partido = props.PARTIDO || '';
    const nomencla = props.NOMENCLA || '';
    const area = props.ARA1 ? `${Number(props.ARA1).toLocaleString('es-AR')} m²` : '';

    // Link a la consulta oficial de valuación fiscal en ARBA. No se puede
    // traer el valor automáticamente (el trámite pide resolver un captcha),
    // así que le facilitamos al vecino el partido/partida y el link directo
    // para que la complete él mismo en una pestaña nueva.
    const arbaLink = `
        <div class="popup-field popup-arba">
            <div class="popup-field-label">Partido / Partida</div>
            <div class="popup-field-value">${escapeHtml(partido)} / ${escapeHtml(String(partida))}</div>
            <a class="popup-arba-link" href="https://www.arba.gov.ar/Aplicaciones/Informacion.asp?op=val2018" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-arrow-up-right-from-square"></i> Consultar valuación en ARBA
            </a>
        </div>`;

    highlightLayer.bindPopup(`
        <div class="custom-popup">
            <div class="popup-header" style="background:#1a2a4f">
                <h4>Partida ${escapeHtml(String(partida))}</h4>
                ${nomencla ? `<div class="popup-status">${escapeHtml(nomencla)}</div>` : ''}
            </div>
            <div class="popup-body">
                ${area ? `<div class="popup-field"><div class="popup-field-label">Superficie</div><div class="popup-field-value">${escapeHtml(area)}</div></div>` : ''}
                <div class="popup-field"><div class="popup-field-label">Capa</div><div class="popup-field-value">${escapeHtml(layersConfig[layerKey]?.name || layerKey)}</div></div>
                ${arbaLink}
            </div>
        </div>
    `, { maxWidth: 320 }).openPopup();

    const bounds = highlightLayer.getBounds();
    if (bounds.isValid()) {
        state.map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 19, duration: 1 });
    }
}

function clearHighlight() {
    if (highlightLayer) {
        state.map.removeLayer(highlightLayer);
        highlightLayer = null;
    }
}

function setStatus(el, html, type) {
    el.innerHTML = html;
    el.className = 'partida-search-status' + (type ? ' ' + type : '');
}
