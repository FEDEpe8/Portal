// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

export const CHASCOMUS_CENTER = [-35.5769, -58.0086];
export const DEFAULT_ZOOM = 13;

// ============================================
// CONFIGURACIÓN DE CAPAS
// ============================================

// Campos que se muestran en el popup de las capas de rubros/comercios.
// Es una lista curada a propósito: se omiten CUIT, contacto, categoría
// fiscal, padrón, inspector/a, fechas de visita/vencimiento, observaciones
// y coordenadas, porque son datos de gestión interna y no de interés público.
const RUBRO_POPUP_FIELDS = [
    ['NOMBRE / COMERCIO', 'Nombre'],
    ['RUBRO', 'Rubro'],
    ['DIRECCIÓN', 'Dirección'],
    ['BARRIO', 'Barrio']
];

// Campos del popup para la capa de Zonificación (Dec. Ley 8912/77), traída
// de urBAsig (Dirección Provincial de Ordenamiento Urbano y Territorial).
const ZONIFICACION_POPUP_FIELDS = [
    ['descripcio', 'Zona'],
    ['designacio', 'Código'],
    ['zonas', 'Uso predominante'],
    ['u_c_r', 'Área'],
    ['ud', 'Uso dominante'],
    ['uc', 'Uso complementario'],
    ['fos', 'FOS (ocupación del suelo)'],
    ['fota', 'FOT (edificabilidad total)'],
    ['dena', 'Densidad neta admitida'],
    ['denp', 'Densidad neta proyectada'],
    ['sm', 'Superficie mínima de parcela (m²)'],
    ['lm', 'Ancho mínimo de lote (m)'],
    ['hmax', 'Altura máxima'],
    ['observacio', 'Observaciones'],
    ['ord_ma', 'Ordenanza'],
    ['dec_ma', 'Decreto']
];

// Campos del popup para las capas de Área de Servicio de Agua / Cloaca,
// traídas del WFS del Ministerio de Infraestructura (geoinfra.minfra.gba.gov.ar).
const AREA_SERVICIO_POPUP_FIELDS = [
    ['municipio', 'Municipio'],
    ['tipo', 'Tipo de servicio'],
    ['partido', 'Partido'],
    ['actualiza', 'Actualizado'],
    ['origen_inf', 'Origen de la información']
];

// Campos del popup para las capas de líneas de colectivo (transporte público).
// "description" solo lo traen los puntos de parada (el trazado en sí no lo
// usa), así que en esos features aparece como "Descripción: Parada linea 381".
// Los horarios por parada son ESTIMADOS (offset por parada calculado a partir
// del turno matutino, no un dato real medido en cada parada):
// - "horario" lo tienen las 23 paradas de Vuelta (un solo turno, anclado al
//   dato real de "próximas llegadas" en la rotonda).
// - Las 22 paradas de Ida tienen 4 turnos (matutino/mediodía/tarde/vespertino),
//   todos con el mismo offset por parada que salió del turno matutino.
const LINEA_COLECTIVO_POPUP_FIELDS = [
    ['sentido', 'Sentido'],
    ['empresa', 'Empresa'],
    ['horario_habil', 'Horario (lun a vie)'],
    ['horario_finde', 'Horario (sáb y dom)'],
    ['horario', 'Horario de paso (estimado)'],
    ['horario_matutino', 'Turno mañana (aprox.)'],
    ['horario_mediodia', 'Turno mediodía (aprox.)'],
    ['horario_tarde', 'Turno tarde (aprox.)'],
    ['horario_vespertino', 'Turno tarde-noche (aprox.)'],
    ['duracion_viaje', 'Duración del viaje'],
    ['cantidad_paradas', 'Cantidad de paradas'],
    ['paradas', 'Paradas (en orden)'],
    ['description', 'Descripción'],
    ['nota', 'Nota'],
    ['fuente', 'Fuente']
];

export const layersConfig = {
    barrios:              { name: 'Barrios',               icon: 'fas fa-draw-polygon',    group: 'territorio', url: 'capas/barrios.geojson',                     type: 'polygon', legendColor: '#3498db', useCluster: false },
    ediMuni:              { name: 'Edificios Municipales', icon: 'fas fa-landmark',        group: 'gestion',    url: 'capas/edimunicipales.geojson',              type: 'point',   emoji: '🕋', useCluster: true },
    sedes:                { name: 'Sedes Barriales',       icon: 'fas fa-home',            group: 'ong',        url: 'capas/sedesbarriales.geojson',              type: 'point',   emoji: '🏠', useCluster: true },
    ong:                  { name: 'Ong_Osc_Ac',            icon: 'fas fa-home',            group: 'ong',        url: 'capas/ong.geojson',                         type: 'point',   emoji: '🏠', useCluster: true },
    caps:                 { name: 'Caps',                  icon: 'fas fa-home',            group: 'gestion',    url: 'capas/Caps.geojson',                           type: 'point',   emoji: '🏥', useCluster: true },
   
    
    sosRural:             { name: 'SOS Rural',             icon: 'fas fa-tractor',         group: 'produccion',    url: 'capas/sosrural.geojson',                    type: 'point',   emoji: '🚜', useCluster: true },
    apiarios:             { name: 'Apiarios',              icon: 'fas fa-bug',             group: 'produccion',    url: 'capas/apiarios.geojson',                    type: 'point',   emoji: '🐝', useCluster: true },
    acacia:               { name: 'Acacia Negra',          icon: 'fas fa-leaf',            group: 'produccion',    url: 'capas/acacianegra.geojson',                 type: 'point',   emoji: '🌿', useCluster: true },
    alojamientos:         { name: 'Alojamientos',          icon: 'fas fa-hotel',           group: 'turismo',       url: 'capas/alojamientos.geojson',                type: 'point',   emoji: '🏨', useCluster: true },
    restaurantes:         { name: 'Restaurantes',          icon: 'fas fa-utensils',        group: 'turismo',       url: 'capas/restaurantes.geojson',                type: 'point',   emoji: '🍽️', useCluster: true },
    esp_recreativos:      { name: 'Espacios Recreativos',  icon: 'fas fa-tree',            group: 'turismo',       url: 'capas/esp_recreativos.geojson',             type: 'point',   emoji: '🌳', useCluster: true },    //vencidas:             { name: 'Habilitaciones Vencidas', icon: 'fas fa-times-circle',  group: 'comercios',  url: 'capas/vencidas.geojson',                    type: 'point',   emoji: '❌', useCluster: true },
    alimentacion:         { name: 'Alimentación',          icon: 'fas fa-store',           group: 'comercios',     url: 'capas/comercios/alimentacion.geojson',         type: 'point',   emoji: '🛒', useCluster: true, markerColor: '#8e44ad', popupFields: RUBRO_POPUP_FIELDS },
    gastronomia:          { name: 'Gastronomía',           icon: 'fas fa-mug-hot',         group: 'comercios',     url: 'capas/comercios/gastronomia.geojson',          type: 'point',   emoji: '🍽️', useCluster: true, markerColor: '#d35400', popupFields: RUBRO_POPUP_FIELDS },


    automotor:            { name: 'Automotor',             icon: 'fas fa-car',             group: 'comercios',     url: 'capas/comercios/automotor.geojson',            type: 'point',   emoji: '🔧', useCluster: true, markerColor: '#2c3e50', popupFields: RUBRO_POPUP_FIELDS },
    construccion:         { name: 'Construcción',          icon: 'fas fa-hard-hat',        group: 'comercios',     url: 'capas/comercios/construccion.geojson',         type: 'point',   emoji: '🏗️', useCluster: true, markerColor: '#f39c12', popupFields: RUBRO_POPUP_FIELDS },
    belleza:              { name: 'Belleza',               icon: 'fas fa-cut',             group: 'comercios',     url: 'capas/comercios/belleza.geojson',              type: 'point',   emoji: '💇', useCluster: true, markerColor: '#e84393', popupFields: RUBRO_POPUP_FIELDS },
    turismo_rubro:        { name: 'Turismo',               icon: 'fas fa-umbrella-beach',  group: 'comercios',     url: 'capas/comercios/turismo.geojson',              type: 'point',   emoji: '🏨', useCluster: true, markerColor: '#6c5ce7', popupFields: RUBRO_POPUP_FIELDS },

    tecnologia:           { name: 'Tecnología',            icon: 'fas fa-laptop',          group: 'comercios',     url: 'capas/comercios/tecnologia.geojson',           type: 'point',   emoji: '💻', useCluster: true, markerColor: '#00cec9', popupFields: RUBRO_POPUP_FIELDS },

    agro:                 { name: 'Agro',                  icon: 'fas fa-seedling',        group: 'comercios',     url: 'capas/comercios/agro.geojson',                 type: 'point',   emoji: '🌱', useCluster: true, markerColor: '#6c757d', popupFields: RUBRO_POPUP_FIELDS },
    otros:                { name: 'Otros Rubros',          icon: 'fas fa-ellipsis-h',      group: 'comercios',     url: 'capas/comercios/otros.geojson',                type: 'point',   emoji: '🏬', useCluster: true, markerColor: '#795548', popupFields: RUBRO_POPUP_FIELDS },
    // Remiserías y agencias de remis (rubro "TRANSPORTE" en el padrón de
    // habilitaciones comerciales). Antes vivían mezcladas en "Automotor";
    // se movieron acá porque no son talleres/comercios de rubro automotor,
    // sino un servicio de transporte de pasajeros.
    remises:              { name: 'Remises',               icon: 'fas fa-taxi',            group: 'transporte',    url: 'capas/comercios/transporte.geojson',           type: 'point',   emoji: '🚕', useCluster: true, markerColor: '#16a085', popupFields: RUBRO_POPUP_FIELDS },

    departamento:         { name: 'Departamento',          icon: 'fas fa-border-all',      group: 'territorio',    url: 'capas/departamento.geojson',                type: 'polygon', legendColor: '#e74c3c', useCluster: false},
    parcelas_urbanizadas: { name: 'Parcelas Urbanizadas',  icon: 'fas fa-border-all',      group: 'catastro',      url: 'capas/parcelas_urbanizadas.geojson',        type: 'polygon', legendColor: '#e67e22', useCluster: false },
    parcelas_rural:       { name: 'Parcelas Rurales',      icon: 'fas fa-border-all',      group: 'catastro',      url: 'capas/parcelas_rural.geojson',              type: 'polygon', legendColor: '#27ae60', useCluster: false },
    subparcelas:          { name: 'Subparcelas',           icon: 'fas fa-border-all',      group: 'catastro',    url: 'capas/subparcelas.geojson',                 type: 'polygon', legendColor: '#9b59b6', useCluster: false },
    circunscripciones:    { name: 'Circunscripciones',     icon: 'fas fa-border-all',      group: 'catastro',    url: 'capas/circunscripciones.geojson',           type: 'polygon', legendColor: '#2980b9', useCluster: false },
    fracciones:           { name: 'Fracciones',            icon: 'fas fa-border-all',      group: 'catastro',    url: 'capas/fracciones.geojson',                  type: 'polygon', legendColor: '#2c3e50', useCluster: false },
    chacras:              { name: 'Chacras',               icon: 'fas fa-border-all',      group: 'catastro',    url: 'capas/chacras.geojson',                     type: 'polygon', legendColor: '#f39c12', useCluster: false },
    secciones:            { name: 'Secciones',             icon: 'fas fa-border-all',      group: 'territorio',    url: 'capas/secciones.geojson',                   type: 'polygon', legendColor: '#2980b9', useCluster: false },
    quintas:              { name: 'Quintas',               icon: 'fas fa-border-all',      group: 'catastro',    url: 'capas/quintas.geojson',                     type: 'polygon', legendColor: '#16a085', useCluster: false },
    calles_chascomus:     { name: 'Calles pavimentadas / residenciales',   icon: 'fas fa-road',            group: 'catastro',    url: 'capas/calles_pavimentadas_residenciales.geojson',            type: 'line',    legendColor: '#495057', weight: 4, opacity: 0.9, useCluster: false },
    calles_chascomus1:    { name: 'Calles de tierra / rurales',          icon: 'fas fa-road',            group: 'catastro',    url: 'capas/calles_tierra_rurales.geojson',             type: 'line',    legendColor: '#c17a3e', weight: 3, opacity: 0.9, dashArray: '6, 4', useCluster: false },
    Recursos_hidricos:    { name: 'Recursos Hidricos',     icon: 'fas fa-water',           group: 'territorio',    url: 'capas/Recursos_hidricos.geojson',           type: 'polygon', legendColor: '#e74c3c', useCluster: false },
    rutas:                { name: 'Rutas',                 icon: 'fas fa-route',           group: 'territorio',    url: 'capas/rutas.geojson',                       type: 'line',    legendColor: '#d35400', weight: 4, opacity: 0.9, useCluster: false },
    rutas_nacionales:     { name: 'Rutas Nacionales',      icon: 'fas fa-road',            group: 'territorio',    url: 'capas/rutas_nacionales.geojson',            type: 'line',    legendColor: '#ffaa00', weight: 4, opacity: 0.9, useCluster: false },
    esp_verdes:           { name: 'Espacios Verdes',       icon: 'fas fa-tree',            group: 'territorio',    url: 'capas/esp-verdes.geojson',                  type: 'polygon', legendColor: '#00aa00', useCluster: false },
    ffcc:                 { name: 'Vías Férreas',          icon: 'fas fa-train',           group: 'territorio',    url: 'capas/FFCC_PROV_BSAS.geojson',              type: 'line',    legendColor: '#000000', weight: 2, opacity: 0.9, useCluster: false },
    circu:                { name: 'Circunscripciones1',    icon: 'fas fa-border-all',      group: 'catastro',      url: 'capas/circu.geojson',                       type: 'polygon', legendColor: '#1abc9c', useCluster: false },
    zonificacion:         { name: 'Zonificación (DL 8912/77)', icon: 'fas fa-drafting-compass', group: 'catastro', url: 'capas/zonificacion_dl8912.geojson',        type: 'polygon', legendColor: '#8e44ad', useCluster: false, popupFields: ZONIFICACION_POPUP_FIELDS,
        // Coloreado por tipo de zona (propiedad "zonas" del GeoJSON). El orden
        // importa: las reglas más específicas ("extraurbana") van antes que las
        // genéricas ("residencial") porque el match es por substring.
        styleField: 'zonas',
        styleByName: [
            { match: 'extraurbana',   label: 'Residencial extraurbana',         style: { fillColor: '#85c1e9', fillOpacity: 0.35, color: '#2e86c1', weight: 1 } },
            { match: 'residencial',   label: 'Residencial',                     style: { fillColor: '#3498db', fillOpacity: 0.35, color: '#21618c', weight: 1 } },
            { match: 'comercial',     label: 'Comercial',                       style: { fillColor: '#e67e22', fillOpacity: 0.35, color: '#af601a', weight: 1 } },
            { match: 'industrial',    label: 'Industrial',                      style: { fillColor: '#c0392b', fillOpacity: 0.35, color: '#7b241c', weight: 1 } },
            { match: 'agropecuaria',  label: 'Agropecuaria',                    style: { fillColor: '#27ae60', fillOpacity: 0.35, color: '#1e8449', weight: 1 } },
            { match: 'esparcimiento', label: 'Esparcimiento / Espacios verdes', style: { fillColor: '#2ecc71', fillOpacity: 0.4,  color: '#1d8348', weight: 1 } },
            { match: 'especifico',    label: 'Uso específico',                  style: { fillColor: '#7f8c8d', fillOpacity: 0.35, color: '#4d5656', weight: 1 } }
        ],
        styleDefault: { fillColor: '#bdc3c7', fillOpacity: 0.25, color: '#909497', weight: 1 } },
    sendas_bicisendas:    { name: 'Sendas y Bicisendas',   icon: 'fas fa-bicycle',         group: 'servicios',    url: 'capas/Sendas_bicisendas.geojson',            type: 'polygon', legendColor: '#27ae60', useCluster: false,
        // Estilo por tipo de senda (según propiedad "name" del geojson)
        styleByName: [
            { match: 'bici',     label: 'Bicisenda',      style: { fillColor: '#27ae60', fillOpacity: 0.55, color: '#1e8449', weight: 1.5 } },
            { match: 'peatonal', label: 'Senda peatonal', style: { fillColor: '#e67e22', fillOpacity: 0.55, color: '#ca6f1e', weight: 1.5 } }
        ],
        styleDefault: { fillColor: '#95a5a6', fillOpacity: 0.45, color: '#7f8c8d', weight: 1.5 } },
    cobertura_agua:       { name: 'Cobertura de Agua',     icon: 'fas fa-tint',            group: 'servicios',    url: 'capas/Cobertura_Agua.geojson',              type: 'polygon', legendColor: '#2d99e2ff', useCluster: false, popupFields: AREA_SERVICIO_POPUP_FIELDS },
    cobertura_cloaca:     { name: 'Cobertura Cloacal',     icon: 'fas fa-tint',            group: 'servicios',    url: 'capas/Cobertura_Cloaca.geojson',            type: 'polygon', legendColor: '#ffaa00', useCluster: false, popupFields: AREA_SERVICIO_POPUP_FIELDS },
    macromalla:           { name: 'Macromalla',            icon: 'fas fa-network-wired',   group: 'servicios',    url: 'capas/macromalla.geojson',                  type: 'line',    legendColor: '#ff5500', weight: 4, opacity: 0.9, useCluster: false },
    red_elec_primaria:    { name: 'Red Eléctrica Primaria', icon: 'fas fa-bolt',           group: 'servicios',    url: 'capas/red-elec-primaria.geojson',           type: 'line',    legendColor: '#0000ff', weight: 2, opacity: 0.8, useCluster: false },
    contenedores:         { name: 'Contenedores',          icon: 'fas fa-dumpster',        group: 'servicios',    url: 'capas/contenedores.geojson',                type: 'point',   emoji: '🗑️', useCluster: true },
    // Luminarias: el geojson viene de un KML de Google My Maps sin campo de
    // tipo explícito, pero el ícono usado por cada placemark sí distingue la
    // tecnología (paddle "L" = LED, paddle "S" = Sodio). Se colorea por eso.
    luminarias:           { name: 'Luminarias',            icon: 'fas fa-lightbulb',       group: 'servicios',    url: 'capas/Lunimarias.geojson',                  type: 'point',   emoji: '💡', markerColor: '#95a5a6', useCluster: true,
        styleField: 'icon',
        styleByName: [
            { match: 'paddle/l', label: 'LED',   emoji: '💡', color: '#2e86c1' },
            { match: 'paddle/s', label: 'Sodio', emoji: '💡', color: '#e67e22' }
        ] },

    antenas:              { name: 'Antenas',               icon: 'fas fa-tower-cell',      group: 'conectividad',  url: 'capas/antenas.geojson',                     type: 'point',   emoji: '📡', useCluster: true },
    puntosWifi:           { name: 'Puntos Wifi',           icon: 'fas fa-wifi',            group: 'conectividad',  url: 'capas/puntoswifi.geojson',                  type: 'point',   emoji: '🛜', useCluster: true },
    sem:                  { name: 'Estacionamiento Medido', icon: 'fas fa-ban',             group: 'seguridad',  url: 'capas/est-medido.geojson',                   type: 'polygon', legendColor: '#ffd600', useCluster: false,
        // Estilo por zona (según propiedad "name" del geojson)
        styleByName: [
            { match: 'costanera', label: 'Costanera', style: { fillColor: '#e74c3c', fillOpacity: 0.2, color: '#e74c3c', weight: 2 } }
        ],
        styleDefault: { fillColor: '#ff8c00', fillOpacity: 0.2, color: '#ff8c00', weight: 2 } },
    escuelas:             { name: 'Escuelas_chascomus',    icon: 'fas fa-school',          group: 'escuelas',   url: 'capas/escuelas_chascomus.geojson',          type: 'point',   emoji: '🏫', useCluster: true },

    // Línea 381 de colectivo (Expreso Ruta 29 S.R.L.): Ranchos - Chascomús - Rotonda.
    // Datos de horarios y paradas de Moovit (moovitapp.com). El trazado sigue
    // calles reales del tramo urbano de Chascomús (RP20, Av. Juan Manuel de
    // Rosas, Av. Fernando de Arenaza, Av. Hipólito Yrigoyen, Av. Lastra,
    // Balcarce); el tramo hacia Ranchos, fuera del partido, no está trazado
    // por falta de calles mapeadas en el portal (ver "nota" en el popup).
    // El geojson mezcla el trazado (2 LineString, ida/vuelta) con las 45
    // paradas cargadas a mano (Point). Leaflet renderiza cada tipo con su
    // propia lógica (pointToLayer para los puntos, style para las líneas),
    // así que conviven en esta misma capa sin problema. Los puntos no traen
    // "sentido" cargado, por eso usan el emoji/color por defecto de acá
    // (🚏, un color distinto según a qué lado del recorrido pertenece —ver
    // más abajo). Las paradas no traían "sentido" cargado al pegarlas desde
    // Google My Maps; se les asignó automáticamente el sentido de la línea
    // (Vuelta o Ida) a la que caen más cerca geométricamente.
    linea381:             { name: 'Línea 381 (Ranchos - Chascomús)', icon: 'fas fa-bus', group: 'transporte', url: 'capas/linea_381_recorrido.geojson', 
        type: 'line', legendColor: '#c0392b', weight: 5, opacity: 0.9, useCluster: false, popupFields: LINEA_COLECTIVO_POPUP_FIELDS,
        emoji: '🚏', markerColor: '#1ae528ff',
        // Colores distintos por sentido (propiedad "sentido" del geojson). Antes
        // acá las etiquetas "Ida"/"Vuelta" estaban invertidas respecto al campo
        // "nombre" de cada feature del geojson (que sí las tiene bien puestas) y
        // el trazado se veía en verde/naranja "crudo" (color propio del KML, sin
        // pasar por esta regla). Quedan alineadas: Vuelta = entra a Chascomús
        // desde la rotonda (rojo, línea llena), Ida = sale hacia la rotonda
        // (verde, línea punteada). "style" pinta el trazado (LineString);
        // "color"/"emoji" pintan las paradas (Point) de ese mismo sentido, así
        // cada parada queda del color de su línea en vez de un color único.
        styleField: 'sentido',
        styleByName: [
            { match: 'ranchos → chascomús', label: 'Vuelta (Ranchos → Chascomús)', style: { color: '#c0392b', weight: 5, opacity: 0.9 }, color: '#c0392b', emoji: '🚏' },
            { match: 'chascomús → ranchos', label: 'Ida (Chascomús → Ranchos)',    style: { color: '#0ce413ff', weight: 5, opacity: 0.9, dashArray: '8, 6' }, color: '#0ce413ff', emoji: '🚏' }
        ] }
};



// ============================================
// GRUPOS DE CAPAS
// ============================================

export const groups = {
    territorio: { name: '🏘️ Territorio',           icon: 'fas fa-map',              order: 1 },
    catastro: {name: 'Catastro',                   icon: 'fas fa-map',              order: 2 },
    servicios: {name: 'Servicios',                 icon: 'fas fa-map',              order: 3 },
    produccion: { name: '🌿 Producción',           icon: 'fas fa-seedling',         order: 4 },
    turismo:    { name: '🌎 Turismo',              icon: 'fas fa-umbrella-beach',   order: 5 },
    comercios:   { name: '🏷️ Comercios',           icon: 'fas fa-tags',             order: 6 },
    gestion:    { name: '🏛️ Gestión',              icon: 'fas fa-city',             order: 7 },
    ong:        { name: '🏤 Ong_Osc_Ac',           icon: 'fas fa-city',             order: 8 },
    conectividad: { name: '📡 Conectividad',       icon: 'fas fa-wifi',             order: 9 },
    seguridad:  { name: '🚨 Seguridad',            icon: 'fas fa-shield-alt',       order: 10 },
    escuelas:   { name: '🎓 Escuelas_chascomus',   icon: 'fas fa-graduation-cap',   order: 11 },
    transporte: { name: '🚌 Transporte',           icon: 'fas fa-bus',              order: 12 }

};
