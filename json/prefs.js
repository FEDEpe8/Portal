// ============================================
// PERSISTENCIA DE PREFERENCIAS
// ============================================

import { state } from './state.js';

const STORAGE_KEY = 'chascomus_sig_prefs';

export function savePreferences() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            basemap: state.currentBasemap,
            activeLayers: Array.from(state.activeLayers)
        }));
    } catch(e) { /* storage lleno o bloqueado */ }
}

export function loadPreferences() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const prefs = JSON.parse(saved);
            if (prefs.basemap) state.currentBasemap = prefs.basemap;
            if (prefs.activeLayers) state.activeLayers = new Set(prefs.activeLayers);
        }
    } catch(e) { /* ignorar JSON inválido */ }
}
