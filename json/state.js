// ============================================
// ESTADO COMPARTIDO
// Objeto mutable importado por todos los módulos.
// Se mutан las propiedades, no la referencia.
// ============================================

export const state = {
    map: null,
    currentBasemap: 'osm',
    activeLayers: new Set(),
    layerGroups: {},
    layerData: {}
};
