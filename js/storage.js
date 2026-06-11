// storage.js — capa de persistencia. Único módulo que sabe que existe
// localStorage; aquí no se toca el DOM. Si mañana la persistencia cambia
// (API remota, IndexedDB), solo se reescribe este archivo: app.js sigue
// llamando a las mismas dos funciones.

const CLAVE_ALMACENAMIENTO = 'habitos-app:habitos';

/**
 * Guarda el array completo de hábitos.
 * @param {Array<object>} habitos
 */
export function guardarHabitos(habitos) {
  // localStorage solo almacena strings: serializamos a JSON.
  localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(habitos));
}

/**
 * Carga los hábitos guardados.
 * @returns {Array<object>} los hábitos, o [] en primera visita o dato corrupto.
 */
export function cargarHabitos() {
  const datosCrudos = localStorage.getItem(CLAVE_ALMACENAMIENTO);

  // Primera visita: la clave no existe todavía. Devolver [] permite que
  // app.js trate "sin datos" y "lista vacía" como el mismo caso.
  if (datosCrudos === null) {
    return [];
  }

  try {
    const datos = JSON.parse(datosCrudos);

    // JSON.parse puede devolver algo válido pero con la forma equivocada
    // (p. ej. alguien guardó un objeto bajo nuestra clave): lo tratamos
    // igual que un dato corrupto.
    if (!Array.isArray(datos)) {
      return [];
    }

    return datos;
  } catch (error) {
    // El string guardado no es JSON válido: mejor empezar de cero que
    // dejar la app rota en cada arranque.
    console.error('No se pudieron leer los hábitos guardados, se reinicia la lista.', error);
    return [];
  }
}
