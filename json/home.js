// ============================================
// LANDING — Tarjetas de categoría
// Arma la grilla de "Explorar por categoría" a partir de la misma
// configuración de capas que usa el visor (json/config.js), para que
// nunca quede desactualizada.
// ============================================

import { groups, layersConfig } from './config.js';

// Descripciones cortas por categoría (no vienen en config.js)
const DESCRIPTIONS = {
    territorio: 'Límites y recursos hídricos del partido.',
    catastro: 'calles, parcelas, parcelas rurales, etc.',
    servicios: 'cloaca, agua, sendas y bicisendas.' ,
    produccion: 'Actividad rural: SOS Rural, apiarios y forestación.',
    turismo: 'Alojamientos, gastronomía y espacios recreativos.',
    comercios: 'Comercios por rubro: alimentación, automotor, belleza y más.',
    gestion: 'Edificios municipales, CAPS y parcelas urbanizadas.',
    ong: 'Organizaciones no gubernamentales y sedes barriales.',
    conectividad: 'Antenas y puntos de WiFi público.',
    seguridad: 'Sem, Defensa Civil, Policia, Bomberos, etc.',
    escuelas: 'Establecimientos educativos del partido.'
};

// El nombre de cada grupo viene como "🏘️ Territorio" (emoji + texto)
function splitEmoji(name) {
    const trimmed = (name || '').trim();
    const firstSpace = trimmed.indexOf(' ');
    if (firstSpace === -1) return { emoji: '', text: trimmed };
    return { emoji: trimmed.slice(0, firstSpace), text: trimmed.slice(firstSpace + 1) };
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
}

function buildCategoryCards() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;

    const sortedGroups = Object.entries(groups).sort((a, b) => a[1].order - b[1].order);

    const cardsHtml = sortedGroups.map(([groupId, groupInfo]) => {
        const count = Object.values(layersConfig).filter((l) => l.group === groupId).length;
        if (count === 0) return '';

        const { emoji, text } = splitEmoji(groupInfo.name);
        const description = DESCRIPTIONS[groupId] || 'Capas geográficas de esta categoría.';

        return `
            <a class="category-card" href="mapa.html?grupo=${encodeURIComponent(groupId)}">
                <div class="category-icon" aria-hidden="true">
                    <i class="${groupInfo.icon}"></i>
                </div>
                <div class="category-body">
                    <h3>${emoji ? emoji + ' ' : ''}${escapeHtml(text)}</h3>
                    <p>${escapeHtml(description)}</p>
                </div>
                <span class="category-count">${count}</span>
            </a>`;
    }).join('');

    grid.innerHTML = cardsHtml;
}

document.addEventListener('DOMContentLoaded', buildCategoryCards);
