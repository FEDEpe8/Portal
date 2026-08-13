// ============================================
// HELPERS DE UI
// ============================================

import { state } from './state.js';

// --- Debounce ---
export function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// --- Toast notification ---
export function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, duration);
}

// --- Escape HTML ---
export function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
}

// --- Panel lateral ---
export function abrirPanel() {
    const sidebar   = document.getElementById('sidebar');
    const mapDiv    = document.getElementById('map');
    const tools     = document.getElementById('toolsContainer');
    const openBtn   = document.getElementById('openPanelBtn');
    const menuToggle = document.getElementById('menuToggle');

    sidebar.classList.remove('collapsed');
    mapDiv.classList.remove('full');
    tools.classList.remove('shifted');
    openBtn.classList.remove('visible');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');

    setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 300);
}

// --- Menú desplegable de herramientas (header) ---
export function initToolsMenu() {
    const toggleBtn = document.getElementById('toolsToggleBtn');
    const menu = document.getElementById('toolsMenu');
    if (!toggleBtn || !menu) return;

    const icon = toggleBtn.querySelector('i');

    function setOpen(willOpen) {
        menu.classList.toggle('open', willOpen);
        toggleBtn.classList.toggle('open', willOpen);
        toggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        toggleBtn.title = willOpen ? 'Ocultar herramientas' : 'Herramientas';
        toggleBtn.setAttribute('aria-label', willOpen ? 'Ocultar herramientas' : 'Mostrar herramientas');
        if (icon) icon.className = willOpen ? 'fas fa-times' : 'fas fa-bars';
    }

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!menu.classList.contains('open'));
    });

    // Cerrar el menú luego de elegir una herramienta (dejamos que el propio
    // botón (gps/medición/imprimir/mapa base) procese su click primero).
    menu.addEventListener('click', (e) => {
        if (!e.target.closest('.tools-menu-item')) return;
        setTimeout(() => setOpen(false), 80);
    });

    // Cerrar si se clickea afuera del menú
    document.addEventListener('click', (e) => {
        if (!menu.classList.contains('open')) return;
        if (e.target.closest('#toolsMenu') || e.target.closest('#toolsToggleBtn')) return;
        setOpen(false);
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) setOpen(false);
    });
}

export function cerrarPanel() {
    const sidebar   = document.getElementById('sidebar');
    const mapDiv    = document.getElementById('map');
    const tools     = document.getElementById('toolsContainer');
    const openBtn   = document.getElementById('openPanelBtn');
    const menuToggle = document.getElementById('menuToggle');

    if (!sidebar.classList.contains('collapsed')) {
        sidebar.classList.add('collapsed');
        mapDiv.classList.add('full');
        tools.classList.add('shifted');
        openBtn.classList.add('visible');
    }
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');

    setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 300);
}
