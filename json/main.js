// ============================================
// PUNTO DE ENTRADA PRINCIPAL
// ============================================

import { layersConfig, groups } from './config.js';
import { loadPreferences } from './prefs.js';
import { showToast, abrirPanel, cerrarPanel, initToolsMenu } from './ui.js';
import { state } from './state.js';
import { initMap } from './map.js';
import { initBasemaps } from './basemaps.js';
import { buildLayersUI, setupLayerFilter, loadLayer, restoreActiveLayers } from './layers.js';
import { initMeasure } from './measure.js';
import { initPrint } from './print.js';
import { initPartidaSearch } from './partidaSearch.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar preferencias guardadas (basemap, capas activas)
    loadPreferences();

    // 2. Inicializar mapa Leaflet
    initMap();

    // 3. Mapa base (panel de miniaturas), buscador, medición e impresión
    initBasemaps(state.map);
    initMeasure(state.map);
    initPrint(state.map);
    initToolsMenu();

    // 4. Construir panel lateral, buscador de capas y buscador de partidas
    buildLayersUI();
    setupLayerFilter();
    initPartidaSearch();

    // 5. Botones del panel
    document.getElementById('openPanelBtn').onclick  = () => abrirPanel();
    document.getElementById('menuToggle').onclick    = () => abrirPanel();
    document.getElementById('closePanelBtn').onclick = () => cerrarPanel();

    // 6. Pre-cargar barrios (capa base siempre visible) y luego restaurar las capas guardadas
    await loadLayer('barrios', layersConfig.barrios);
    await restoreActiveLayers();

    // 7. En mobile, el panel empieza cerrado; en desktop queda abierto
    if (window.innerWidth <= 768) {
        cerrarPanel();
    }

    // 7b. Si venimos de una tarjeta de categoría en el inicio (mapa.html?grupo=territorio),
    // abrimos el panel de capas y desplegamos ese grupo puntual.
    abrirGrupoDesdeUrl();

    showToast('🗺️ Visor SIG de Chascomús listo', 2500);

    // 8. Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registrado:', reg.scope))
            .catch(err => console.warn('SW falló:', err));
    }
});

// ============================================
// DEEP LINK DESDE LA LANDING (?grupo=territorio)
// Al llegar desde una tarjeta de categoría del inicio, mostramos SOLO
// el listado de capas de esa sección (el resto queda oculto hasta que
// el usuario limpie el filtro).
// ============================================

// Devuelve, para cada .layer-group del DOM, a qué id de grupo pertenece
// (comparando su primer checkbox contra layersConfig).
function grupoIdDe(div) {
    const chk = div.querySelector('input[type="checkbox"]');
    const key = chk && chk.dataset.key;
    return key && layersConfig[key] ? layersConfig[key].group : null;
}

function filtrarSoloGrupo(grupoId, etiqueta) {
    document.querySelectorAll('.layer-group').forEach((div) => {
        div.style.display = grupoIdDe(div) === grupoId ? '' : 'none';
    });

    const pill = document.getElementById('groupFilterPill');
    const label = document.getElementById('groupFilterLabel');
    if (pill && label) {
        label.textContent = 'Mostrando: ' + etiqueta;
        pill.hidden = false;
    }
}

function limpiarFiltroGrupo() {
    document.querySelectorAll('.layer-group').forEach((div) => {
        div.style.display = '';
    });
    const pill = document.getElementById('groupFilterPill');
    if (pill) pill.hidden = true;
}

function abrirGrupoDesdeUrl() {
    const params = new URLSearchParams(window.location.search);
    const grupoId = params.get('grupo');
    if (!grupoId) return;

    const groupDivs = Array.from(document.querySelectorAll('.layer-group'));
    const target = groupDivs.find((div) => grupoIdDe(div) === grupoId);
    if (!target) return;

    const grupoInfo = groups[grupoId];
    const etiqueta = grupoInfo ? grupoInfo.name.replace(/^\S+\s*/, '') : grupoId;

    abrirPanel();
    filtrarSoloGrupo(grupoId, etiqueta);

    // Desplegamos directamente los ítems de esa categoría
    const header = target.querySelector('.group-header');
    const items = target.querySelector('.layer-items');
    if (header && items && !header.classList.contains('open')) {
        header.classList.add('open');
        items.classList.add('show');
        header.setAttribute('aria-expanded', 'true');
    }

    // Botón "x" de la píldora: vuelve a mostrar todas las categorías
    const clearBtn = document.getElementById('groupFilterClear');
    if (clearBtn) clearBtn.onclick = limpiarFiltroGrupo;

    // Si el usuario empieza a buscar por texto, el filtro de categoría
    // deja de tener sentido: mostramos todo de nuevo y dejamos que el
    // buscador de capas (layers.js) haga su trabajo normalmente.
    const searchInput = document.getElementById('searchLayers');
    if (searchInput) {
        searchInput.addEventListener('input', limpiarFiltroGrupo, { once: true });
    }

    setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);
}
