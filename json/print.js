// ============================================
// IMPRESIÓN DEL MAPA
// Activa un "modo impresión" (oculta UI, agrega info de referencia)
// y dispara la impresión nativa del navegador con un CSS dedicado.
// ============================================

import { state } from './state.js';
import { showToast } from './ui.js';

export function initPrint(map) {
    // Barra de escala, útil tanto en pantalla como en la impresión
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.onclick = () => imprimirMapa(map);
}

function imprimirMapa(map) {
    const printInfo = document.getElementById('printInfo');
    if (printInfo) {
        const center = map.getCenter();
        const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        printInfo.innerHTML = `
            <strong>Visor SIG · Municipalidad de Chascomús</strong><br>
            Fecha: ${fecha} &nbsp;|&nbsp; Zoom: ${map.getZoom()} &nbsp;|&nbsp;
            Centro: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)} &nbsp;|&nbsp;
            Mapa base: ${state.currentBasemap}`;
    }

    showToast('🖨️ Preparando impresión...');
    document.body.classList.add('print-mode');

    // Pequeña espera para que el navegador renderice el modo impresión antes del diálogo
    setTimeout(() => {
        window.print();
    }, 350);
}

// Restaurar la interfaz normal al cerrar el diálogo de impresión
window.addEventListener('afterprint', () => {
    document.body.classList.remove('print-mode');
});
