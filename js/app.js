// app.js — estado, render y eventos. La persistencia vive en storage.js.

/*
 * Modelo de datos de un hábito:
 *
 * {
 *   id: string,            // identificador único (crypto.randomUUID())
 *   nombre: string,        // "Beber 2 litros de agua"
 *   frecuencia: string,    // "diario" | "lunes-viernes"
 *   creadoEl: string,      // fecha de creación, "YYYY-MM-DD"
 *   completados: []        // fechas en que se cumplió, ["2026-06-10", ...]
 * }
 *
 * Las fechas van como strings "YYYY-MM-DD" y no como objetos Date porque
 * JSON no tiene tipo fecha: al serializar, un Date se convierte en string
 * ISO con hora y zona horaria, y al deserializar NO vuelve a ser Date,
 * sino un string — la conversión solo va de ida. Guardando ya el formato
 * "YYYY-MM-DD" el dato es estable, comparable con === ("¿completado hoy?")
 * y ordenable alfabéticamente (orden alfabético == orden cronológico).
 */

import { cargarHabitos } from './storage.js';

// --- Estado ---

let habitos = cargarHabitos();
console.log('Hábitos cargados desde localStorage:', habitos);

// --- Fecha en el header ---

const fechaHoy = document.querySelector('#fecha-hoy');
const formateadorFecha = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
fechaHoy.textContent = formateadorFecha.format(new Date());

// --- Eventos ---

const formHabito = document.querySelector('#form-habito');

formHabito.addEventListener('submit', (evento) => {
  // Sin esto, el submit recarga la página y perderíamos el estado en memoria.
  evento.preventDefault();

  // TODO: crear el hábito desde los campos del form, añadirlo al estado,
  // guardar con guardarHabitos() y renderizar la lista.
});
