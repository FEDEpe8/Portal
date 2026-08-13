// ============================================
// HERRAMIENTAS DE MEDICIÓN: DISTANCIA Y ÁREA
// Usa turf.js (cargado globalmente) para los cálculos geodésicos.
// ============================================

import { showToast } from './ui.js';

let map = null;
let measureLayer = null;
let mode = null;            // 'distance' | 'area' | null
let points = [];            // L.LatLng[]
let vertexMarkers = [];
let tempShape = null;

export function initMeasure(leafletMap) {
    map = leafletMap;
    measureLayer = L.layerGroup().addTo(map);

    document.getElementById('measureDistanceBtn').onclick = () => startMeasure('distance');
    document.getElementById('measureAreaBtn').onclick = () => startMeasure('area');
    document.getElementById('measureClearBtn').onclick = () => clearMeasurements();
    document.getElementById('measureFinishBtn').onclick = () => finishMeasure();
    document.getElementById('measureCancelBtn').onclick = () => cancelMeasure();

    map.on('click', (e) => {
        if (!mode) return;
        addPoint(e.latlng);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mode) cancelMeasure();
    });
}

function startMeasure(newMode) {
    if (mode) cancelActiveDrawing();
    mode = newMode;
    points = [];

    document.getElementById('measureDistanceBtn').classList.toggle('active', mode === 'distance');
    document.getElementById('measureAreaBtn').classList.toggle('active', mode === 'area');

    showMeasureBar(mode === 'distance'
        ? 'Click en el mapa para marcar puntos de la línea'
        : 'Click en el mapa para marcar los vértices del área');

    if (map) map.getContainer().style.cursor = 'crosshair';
}

function addPoint(latlng) {
    points.push(latlng);
    const marker = L.circleMarker(latlng, {
        radius: 5, color: '#1a2a4f', weight: 2, fillColor: '#b8d30f', fillOpacity: 1
    }).addTo(measureLayer);
    vertexMarkers.push(marker);
    updateShape();
}

function updateShape() {
    if (tempShape) {
        measureLayer.removeLayer(tempShape);
        tempShape = null;
    }
    if (points.length < 2) {
        setMeasureResult('');
        return;
    }

    if (mode === 'distance') {
        tempShape = L.polyline(points, { color: '#1a2a4f', weight: 3, dashArray: '6,6' }).addTo(measureLayer);
        setMeasureResult(formatDistance(computeDistanceKm(points)));
    } else if (mode === 'area') {
        if (points.length < 3) {
            tempShape = L.polyline(points, { color: '#1a2a4f', weight: 3, dashArray: '6,6' }).addTo(measureLayer);
            setMeasureResult('Marcá al menos 3 puntos');
            return;
        }
        tempShape = L.polygon(points, { color: '#1a2a4f', weight: 2, fillColor: '#b8d30f', fillOpacity: 0.25 }).addTo(measureLayer);
        setMeasureResult(formatArea(computeAreaM2(points)));
    }
}

function computeDistanceKm(latlngs) {
    if (typeof turf === 'undefined') {
        // Fallback sin turf: suma de distancias Leaflet (haversine)
        let total = 0;
        for (let i = 1; i < latlngs.length; i++) total += latlngs[i - 1].distanceTo(latlngs[i]);
        return total / 1000;
    }
    const line = turf.lineString(latlngs.map((p) => [p.lng, p.lat]));
    return turf.length(line, { units: 'kilometers' });
}

function computeAreaM2(latlngs) {
    const coords = latlngs.map((p) => [p.lng, p.lat]);
    coords.push(coords[0]);
    if (typeof turf === 'undefined') {
        return L.GeometryUtil && L.GeometryUtil.geodesicArea
            ? Math.abs(L.GeometryUtil.geodesicArea(latlngs))
            : 0;
    }
    const poly = turf.polygon([coords]);
    return turf.area(poly);
}

function formatDistance(km) {
    if (km < 1) return Math.round(km * 1000) + ' m';
    return km.toFixed(2) + ' km';
}

function formatArea(m2) {
    if (m2 < 10000) return Math.round(m2) + ' m²';
    return (m2 / 10000).toFixed(2) + ' ha';
}

function finishMeasure() {
    const minPoints = mode === 'area' ? 3 : 2;
    const isValid = tempShape && points.length >= minPoints;

    if (isValid) {
        const result = mode === 'distance' ? formatDistance(computeDistanceKm(points)) : formatArea(computeAreaM2(points));
        tempShape.bindTooltip(result, {
            permanent: true, direction: 'center', className: 'measure-tooltip'
        }).openTooltip();
        showToast('✅ Medición: ' + result);
    } else {
        if (tempShape) measureLayer.removeLayer(tempShape);
        vertexMarkers.forEach((m) => measureLayer.removeLayer(m));
        showToast('⚠️ Marcá al menos ' + minPoints + ' puntos antes de finalizar', 3500);
    }
    resetDrawingState();
    hideMeasureBar();
}

function cancelMeasure() {
    cancelActiveDrawing();
    resetDrawingState();
    hideMeasureBar();
}

// Quita solo el dibujo en curso (vértices + forma temporal), conserva mediciones finalizadas
function cancelActiveDrawing() {
    vertexMarkers.forEach((m) => measureLayer.removeLayer(m));
    if (tempShape) measureLayer.removeLayer(tempShape);
}

function resetDrawingState() {
    mode = null;
    points = [];
    vertexMarkers = [];
    tempShape = null;
    document.getElementById('measureDistanceBtn').classList.remove('active');
    document.getElementById('measureAreaBtn').classList.remove('active');
    if (map) map.getContainer().style.cursor = '';
}

function clearMeasurements() {
    cancelActiveDrawing();
    measureLayer.clearLayers();
    resetDrawingState();
    hideMeasureBar();
    showToast('🧹 Mediciones borradas');
}

function showMeasureBar(label) {
    const bar = document.getElementById('measureBar');
    document.getElementById('measureBarLabel').textContent = label;
    setMeasureResult('');
    bar.classList.add('show');
}

function hideMeasureBar() {
    document.getElementById('measureBar').classList.remove('show');
}

function setMeasureResult(text) {
    const el = document.getElementById('measureBarResult');
    if (el) el.textContent = text;
}
