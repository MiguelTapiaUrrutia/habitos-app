// fechas.js — utilidades puras de fechas y cálculo de rachas. Sin DOM y sin
// storage: todo aquí son funciones (entrada → salida) que se pueden probar
// en Node sin abrir el navegador. La lógica de fechas es la más propensa a
// bugs (zonas horarias, horario de verano); por eso vive aislada.

// Trabajamos los Date internos a mediodía: en los cambios de horario de
// verano (en Chile, los relojes saltan cerca de medianoche) un Date a las
// 00:00 puede caer en el día equivocado al sumar o restar días. A las 12:00
// ningún salto de ±1 hora cambia la fecha.
const HORA_SEGURA = 12;

// "2026-06-10" → Date local del 10 de junio a mediodía.
function aFecha(cadena) {
  const [anio, mes, dia] = cadena.split('-').map(Number);
  return new Date(anio, mes - 1, dia, HORA_SEGURA);
}

// Date → "YYYY-MM-DD" usando los getters LOCALES. No usamos toISOString()
// porque convierte a UTC: en Chile (UTC-3/UTC-4), entre las 21:00 y las
// 23:59 toISOString() ya va por "mañana" y devolvería el día equivocado.
export function formatearFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Hoy en hora local, "YYYY-MM-DD".
export function fechaHoy() {
  return formatearFecha(new Date());
}

// El día anterior, también anclado a mediodía. Restar en el constructor
// (dia - 1) es seguro: Date normaliza solo los desbordes (el "0 de junio"
// se convierte en el 31 de mayo).
function diaAnterior(fecha) {
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate() - 1,
    HORA_SEGURA
  );
}

function esFinDeSemana(fecha) {
  const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
  return diaSemana === 0 || diaSemana === 6;
}

/**
 * Cuenta los días consecutivos de hábito cumplido, mirando hacia atrás
 * desde la fecha de referencia (hoy, salvo en tests).
 *
 * Reglas:
 * - Si hoy está completado, la racha lo incluye.
 * - Si hoy NO está completado, no rompe la racha (el día no terminó:
 *   el usuario todavía puede completarlo) — pero tampoco suma.
 * - Cualquier otro día exigible sin completar rompe la racha.
 * - Con frecuencia "lunes-viernes", sábado y domingo no son exigibles:
 *   no suman ni rompen, simplemente se saltan.
 *
 * @param {string[]} completados fechas "YYYY-MM-DD"
 * @param {string} frecuencia "diario" | "lunes-viernes"
 * @param {string} [referencia] fecha "YYYY-MM-DD" desde la que mirar atrás
 * @returns {number} días de racha
 */
export function calcularRacha(completados, frecuencia, referencia = fechaHoy()) {
  if (completados.length === 0) {
    return 0;
  }

  const diasCompletados = new Set(completados);
  const soloLaborales = frecuencia === 'lunes-viernes';

  let cursor = aFecha(referencia);
  let esElPrimerDia = true;
  let racha = 0;

  while (true) {
    const esDiaExigible = !(soloLaborales && esFinDeSemana(cursor));

    if (esDiaExigible) {
      if (diasCompletados.has(formatearFecha(cursor))) {
        racha += 1;
      } else if (!esElPrimerDia) {
        break;
      }
      // Primer día (hoy) sin completar: no suma, pero no rompe.
    }
    // Día no exigible: se salta sin tocar la racha.

    esElPrimerDia = false;
    cursor = diaAnterior(cursor);
  }

  return racha;
}
