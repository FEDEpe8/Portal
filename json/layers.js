// ============================================
// GESTIÓN DE CAPAS
// ============================================

import { layersConfig, groups } from './config.js';
import { state } from './state.js';
import { showToast, escapeHtml, debounce } from './ui.js';
import { savePreferences } from './prefs.js';
import { getStatusColor, createCustomMarker, getOrCreateLayerGroup } from './map.js';

// Campos técnicos que no se muestran en popups ciudadanos
const TECHNICAL_FIELDS = new Set([
    'fid', 'objectid', 'object_id', 'globalid', 'gid',
    'shape_area', 'shape_leng', 'shape_length', 'shape',
    'created_user', 'created_date', 'last_edited_user', 'last_edited_date',
    'st_area', 'st_length', 'geom', 'geometry', 'wkb_geometry',
    // Campos de estilo/ícono de KML/KMZ/Google Maps
    'styleurl', 'style_url', 'icon', 'icon-opacity', 'icon-color',
    'icon-scale', 'icon_opacity', 'icon_color', 'icon_scale',
    'icon_url', 'icon-url', 'icon_href', 'icon-href',
    'label-color', 'label_color', 'label-scale', 'label_scale',
    'line-color', 'line_color', 'line-width', 'line_width',
    'poly-color', 'poly_color', 'poly_fill', 'poly-fill',
    'fill', 'stroke', 'stroke-width', 'stroke-opacity', 'fill-opacity',
    'marker-color', 'marker_color', 'marker-size', 'marker_size',
    'marker-symbol', 'marker_symbol', 'tessellate', 'extrude',
    'visibility', 'snippet', 'description_html',
    // "Descripción" plano: en capas exportadas de KML (ej: barrios) duplica
    // como texto el mismo volcado de styleUrl/fill/stroke que ya se filtra
    // arriba. No aporta info útil al vecino, así que se omite también.
    'descripción', 'descripcion'
]);

// Prefijos técnicos: cualquier campo que empiece con estos se omite
const TECHNICAL_PREFIXES = ['icon', 'style', 'kml_', '_', 'sys_'];

// Campos que ya se muestran en el encabezado del popup
const HEADER_FIELDS = new Set(['nombre', 'name', 'estado', 'nombre_barrio', 'nom_barrio']);

// ---- Prettificar nombre de campo ----
function prettifyFieldName(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// ---- Expandir campos "description" tipo KML/HTML ----
// Ciertas capas (ej: exportadas desde Google Earth/KML) traen la propiedad
// "description" como un objeto { "@type": "html", "value": "<table>...</table>" }
// en vez de texto plano. Como es un objeto, el filtro genérico de popups lo
// descarta y esos datos (RUTA, TRAMO, SECCION, etc.) nunca se muestran.
// Esta función detecta ese patrón y extrae los pares clave/valor de la tabla HTML.
function extractHtmlDescriptionFields(value) {
    if (!value || typeof value !== 'object') return [];
    const html = typeof value.value === 'string' ? value.value : '';
    if (!html || !/<[a-z][\s\S]*>/i.test(html)) return [];

    const fields = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(html))) {
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const cells = [];
        let tdMatch;
        while ((tdMatch = tdRegex.exec(trMatch[1]))) {
            const text = tdMatch[1]
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/gi, ' ')
                .replace(/&amp;/gi, '&')
                .trim();
            cells.push(text);
        }
        if (cells.length >= 2 && cells[0]) fields.push([cells[0], cells[1]]);
    }

    // Si no hay tabla, intentar el formato "CLAVE  valor<br>CLAVE  valor..."
    if (fields.length === 0) {
        const plain = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
        plain.split('\n').forEach(line => {
            const match = line.trim().match(/^([A-Za-zÀ-ÿ_ ]+?)\s{2,}(.*)$/);
            if (match) fields.push([match[1].trim(), match[2].trim()]);
        });
    }

    return fields;
}

// ---- Renderizar una capa en el mapa ----
export function renderLayer(key, config, data) {
    const layerGroup = getOrCreateLayerGroup(key);
    layerGroup.clearLayers();
    const emoji = config.emoji || null;
    const polyColor = config.legendColor || '#3498db';

    L.geoJSON(data, {
        pointToLayer(feature, latlng) {
            const estado = feature.properties?.ESTADO || feature.properties?.estado || '';
            // Marcadores diferenciados por tipo (ej: luminarias LED vs Sodio),
            // usando un campo puntual del GeoJSON ("styleField") con reglas de
            // coincidencia por substring, igual que styleByName en polígonos/líneas.
            if (config.styleByName && config.styleField) {
                const v = String(feature.properties?.[config.styleField] || '').toLowerCase();
                const rule = config.styleByName.find(r => v.includes(r.match));
                if (rule) return createCustomMarker(latlng, estado, rule.emoji || emoji, rule.color || config.markerColor);
            }
            return createCustomMarker(latlng, estado, emoji, config.markerColor);
        },
        style(feature) {
            // Estilo diferenciado por nombre de feature (ej: sendas vs bicisendas),
            // o por un campo puntual del GeoJSON si se define "styleField"
            // (ej: zonificacion, coloreada por la propiedad "zonas").
            if (config.styleByName) {
                const n = (config.styleField
                    ? (feature.properties?.[config.styleField] || '')
                    : (feature.properties?.name || feature.properties?.nombre || '')
                ).toLowerCase();
                const rule = config.styleByName.find(r => n.includes(r.match));
                if (rule) return rule.style;
                if (config.styleDefault) return config.styleDefault;
            }
            if (config.type === 'polygon') {
                // Si el GeoJSON trae color propio por feature (ej: barrios, exportado
                // desde KML con fill/stroke/fill-opacity por polígono), lo respetamos
                // en vez de pintar todo con un único color de capa.
                const props = feature.properties || {};
                const featureFill = props.fill || props.Fill || props['fill-color'];
                const featureStroke = props.stroke || props.Stroke || props['stroke-color'] || featureFill;
                const rawOpacity = parseFloat(props['fill-opacity']);
                const fillOpacity = featureFill && Number.isFinite(rawOpacity) ? rawOpacity : 0.25;

                return {
                    fillColor: featureFill || polyColor,
                    fillOpacity,
                    color: featureFill ? featureStroke : 'white',
                    weight: 1.5
                };
            }
            if (config.type === 'line') {
                // Igual que en polígonos: si el GeoJSON trae "stroke" propio por
                // feature (ej: macromalla por etapa, vías), lo respetamos en vez
                // de pintar toda la capa con un único color fijo.
                const props = feature.properties || {};
                const featureStroke = props.stroke || props.Stroke || props['stroke-color'];
                const style = { color: featureStroke || polyColor, weight: config.weight || 3, opacity: config.opacity ?? 0.9 };
                if (config.dashArray) style.dashArray = config.dashArray;
                return style;
            }
            return {};
        },
        onEachFeature(feature, layer) {
            const props = feature.properties || {};
            // Buscar nombre con múltiples claves posibles
            const nombre = props.nombre || props.name || props.NOMBRE || props.nombre_barrio
                        || props.NOM_BARRIO || props.RAZON_SOCIAL || props.razon_social || 'Sin nombre';
            const estado = props.ESTADO || props.estado || '';
            // Si la capa tiene un color fijo (ej: rubros), se ignora el estado
            // vigente/vencida tanto para el color como para el badge del popup.
            const colorHeader = config.markerColor || getStatusColor(estado);

            let popupHtml = `<div class="custom-popup">
                <div class="popup-header" style="background:${colorHeader}">
                    <h4>${escapeHtml(nombre)}</h4>
                    ${(estado && !config.markerColor) ? `<div class="popup-status">${escapeHtml(estado)}</div>` : ''}
                </div>
                <div class="popup-body">`;

            let hasFields = false;

            if (config.popupFields) {
                // Lista curada y acotada de campos (capas de rubros/comercios):
                // se omiten CUIT, contacto, padrón, inspector/a, fechas de
                // visita, observaciones, coordenadas, etc.
                const lowerMap = {};
                for (const [p, val] of Object.entries(props)) lowerMap[p.toLowerCase().trim()] = val;

                for (const [fieldKey, label] of config.popupFields) {
                    const val = lowerMap[fieldKey.toLowerCase().trim()];
                    if (val === undefined || val === null || val === '') continue;

                    hasFields = true;
                    popupHtml += `<div class="popup-field">
                        <div class="popup-field-label">${escapeHtml(label)}</div>
                        <div class="popup-field-value">${escapeHtml(String(val))}</div>
                    </div>`;
                }
            } else {
                // Campos "planos" del GeoJSON + campos expandidos de descripciones HTML/KML
                const allFields = [];
                for (const [p, val] of Object.entries(props)) {
                    if (val && typeof val === 'object') {
                        allFields.push(...extractHtmlDescriptionFields(val));
                    } else {
                        allFields.push([p, val]);
                    }
                }

                for (const [p, val] of allFields) {
                    const keyLower = p.toLowerCase().trim();
                    // Omitir campos vacíos
                    if (val === undefined || val === null || val === '') continue;
                    // Omitir campos técnicos exactos
                    if (TECHNICAL_FIELDS.has(keyLower)) continue;
                    // Omitir campos con prefijos técnicos
                    if (TECHNICAL_PREFIXES.some(prefix => keyLower.startsWith(prefix))) continue;
                    // Omitir campos ya mostrados en el encabezado
                    if (HEADER_FIELDS.has(keyLower)) continue;

                    hasFields = true;
                    popupHtml += `<div class="popup-field">
                        <div class="popup-field-label">${escapeHtml(prettifyFieldName(p))}</div>
                        <div class="popup-field-value">${escapeHtml(String(val))}</div>
                    </div>`;
                }
            }

            if (!hasFields) {
                popupHtml += `<p style="font-size:12px;color:#adb5bd;text-align:center;padding:8px 0;">Sin datos adicionales</p>`;
            }

            popupHtml += '</div></div>';
            layer.bindPopup(popupHtml, { maxWidth: 320 });
        }
    }).addTo(layerGroup);
}

// ---- Cargar capa desde GeoJSON remoto ----
export async function loadLayer(key, config) {
    const item = document.getElementById('chk-' + key);
    const layerItem = item ? item.closest('.layer-item') : null;
    const iconEl    = layerItem ? layerItem.querySelector('.layer-info i') : null;
    const originalClass = iconEl ? iconEl.className : '';

    // Mostrar spinner en el ícono de la capa
    if (iconEl) iconEl.className = 'fas fa-spinner fa-spin';
    if (layerItem) layerItem.classList.add('loading');

    try {
        const response = await fetch(config.url);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();

        // Validar que sea un FeatureCollection válido antes de intentar dibujarlo.
        // Un JSON "plano" (array de registros sin geometría) no es GeoJSON y
        // rompería L.geoJSON con un error poco claro.
        if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
            console.error('Capa "' + key + '" (' + config.url + ') no es un GeoJSON válido: falta "type":"FeatureCollection" y/o "features" con geometría.');
            showToast('⚠️ ' + config.name + ' no tiene formato GeoJSON válido (sin coordenadas)', 5000);
            return;
        }

        state.layerData[key] = data;

        const countSpan = document.getElementById('count-' + key);
        if (countSpan) {
            countSpan.textContent = '(' + data.features.length + ')';
        }

        renderLayer(key, config, data);
    } catch (error) {
        console.error('Error cargando ' + key + ':', error);
        showToast('⚠️ Error al cargar: ' + config.name, 4500);
    } finally {
        // Restaurar ícono original
        if (iconEl) iconEl.className = originalClass;
        if (layerItem) layerItem.classList.remove('loading');
    }
}

// ---- Activar una capa por código (usada por el buscador de partidas) ----
// Carga los datos si hace falta, tilda el checkbox, agrega la capa al mapa
// y persiste el estado, igual que si el usuario la hubiera tildado a mano.
export async function ensureLayerActive(key) {
    const config = layersConfig[key];
    if (!config) return;

    const checkbox = document.getElementById('chk-' + key);
    const group = getOrCreateLayerGroup(key);

    if (!state.layerData[key]) {
        await loadLayer(key, config);
    } else {
        renderLayer(key, config, state.layerData[key]);
    }

    if (checkbox) checkbox.checked = true;
    if (!state.map.hasLayer(group)) group.addTo(state.map);
    state.activeLayers.add(key);
    savePreferences();
}

// ---- Caja de búsqueda por N° de partida (sólo grupo Catastro) ----
function buildPartidaSearchBox() {
    const box = document.createElement('div');
    box.className = 'partida-search-box';
    box.innerHTML = `
        <label class="partida-search-label" for="partidaSearchInput">
            <i class="fas fa-search-location"></i> Buscar N° de partida
        </label>
        <div class="partida-search-row">
            <input type="text" id="partidaSearchInput" class="partida-search-input" inputmode="numeric" autocomplete="off" placeholder="Ej: 3359" aria-label="Buscar por número de partida">
            <button type="button" id="partidaSearchBtn" class="partida-search-btn" aria-label="Buscar partida"><i class="fas fa-search"></i></button>
        </div>
        <div class="partida-search-status" id="partidaSearchStatus" role="status" aria-live="polite"></div>
    `;
    return box;
}

// ---- Restaurar capas activas desde prefs ----
export async function restoreActiveLayers() {
    const promises = [];
    for (const key of state.activeLayers) {
        const config = layersConfig[key];
        if (!config) continue;
        const checkbox = document.getElementById('chk-' + key);
        if (checkbox) checkbox.checked = true;
        const group = getOrCreateLayerGroup(key);
        if (state.layerData[key]) {
            renderLayer(key, config, state.layerData[key]);
        } else {
            promises.push(loadLayer(key, config));
        }
        group.addTo(state.map);
    }
    await Promise.all(promises);
}

// ---- Construir el panel lateral de capas ----
export function buildLayersUI() {
    const container = document.getElementById('layersList');
    container.innerHTML = '';

    const sortedGroups = Object.entries(groups).sort((a, b) => a[1].order - b[1].order);

    for (const [groupId, groupInfo] of sortedGroups) {
        const groupLayers = Object.entries(layersConfig).filter(([, cfg]) => cfg.group === groupId);
        if (groupLayers.length === 0) continue;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'layer-group';

        const header = document.createElement('div');
        header.className = 'group-header';
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        header.innerHTML = `
            <div class="group-header-left">
                <i class="${groupInfo.icon}"></i>
                <span class="group-name">${groupInfo.name}</span>
                <span class="group-badge">${groupLayers.length}</span>
            </div>
            <i class="fas fa-chevron-right group-arrow"></i>`;

        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'layer-items';

        if (groupId === 'catastro') {
            itemsDiv.appendChild(buildPartidaSearchBox());
        }

        for (const [layerKey, layerConfig] of groupLayers) {
            // Generar indicador de leyenda por capa
            let legendHtml = '';
            if (layerConfig.styleByName) {
                // Leyenda multicolor: un cuadrado (polígonos/líneas) o emoji (puntos) por tipo
                legendHtml = layerConfig.styleByName.map(r => (
                    r.style
                        ? `<span class="layer-legend-color square" style="background:${r.style.fillColor}" title="${r.label}" aria-hidden="true"></span>`
                        : `<span class="layer-legend-emoji" title="${r.label}" aria-hidden="true">${r.emoji || '📍'}</span>`
                )).join('');
            } else if (layerConfig.emoji) {
                legendHtml = `<span class="layer-legend-emoji" aria-hidden="true">${layerConfig.emoji}</span>`;
            } else if (layerConfig.legendColor) {
                const shape = layerConfig.type === 'line' ? 'line' : 'square';
                legendHtml = `<span class="layer-legend-color ${shape}" style="background:${layerConfig.legendColor};${shape === 'line' ? 'background:none;border-bottom:3px solid ' + layerConfig.legendColor + ';' : ''}" aria-hidden="true"></span>`;
            }

            const item = document.createElement('div');
            item.className = 'layer-item';
            item.innerHTML = `
                <input type="checkbox" id="chk-${layerKey}" data-key="${layerKey}">
                <div class="layer-info">
                    <i class="${layerConfig.icon}"></i>
                    <span class="layer-name">${layerConfig.name}</span>
                    ${legendHtml}
                    <span class="layer-count" id="count-${layerKey}"></span>
                </div>`;

            const checkbox = item.querySelector('input');
            checkbox.addEventListener('change', () => {
                const group = getOrCreateLayerGroup(layerKey);
                if (checkbox.checked) {
                    if (!state.layerData[layerKey]) {
                        loadLayer(layerKey, layerConfig);
                    } else {
                        renderLayer(layerKey, layerConfig, state.layerData[layerKey]);
                    }
                    group.addTo(state.map);
                    state.activeLayers.add(layerKey);
                } else {
                    group.remove();
                    state.activeLayers.delete(layerKey);
                }
                savePreferences();
            });

            itemsDiv.appendChild(item);
        }

        function toggleGroup() {
            const isOpen = header.classList.toggle('open');
            itemsDiv.classList.toggle('show');
            header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }

        header.addEventListener('click', toggleGroup);
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGroup(); }
        });

        groupDiv.appendChild(header);
        groupDiv.appendChild(itemsDiv);
        container.appendChild(groupDiv);
    }
}

// ---- Filtro de búsqueda de capas ----
export function setupLayerFilter() {
    const searchInput = document.getElementById('searchLayers');
    const filterLayers = debounce((term) => {
        document.querySelectorAll('.layer-item').forEach((item) => {
            const name = item.querySelector('.layer-name');
            const text = name ? name.textContent.toLowerCase() : '';
            item.style.display = text.includes(term) ? '' : 'none';
        });
        document.querySelectorAll('.layer-group').forEach((group) => {
            const hasVisible = [...group.querySelectorAll('.layer-item')].some(i => i.style.display !== 'none');
            group.style.display = hasVisible ? '' : 'none';
        });
    }, 200);

    searchInput.addEventListener('input', (e) => {
        filterLayers(e.target.value.toLowerCase().trim());
    });
}
