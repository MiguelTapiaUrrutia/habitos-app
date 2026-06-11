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

import { guardarHabitos, cargarHabitos } from './storage.js';

const LONGITUD_MAXIMA_NOMBRE = 50;

const ETIQUETAS_FRECUENCIA = {
  'diario': 'Diario',
  'lunes-viernes': 'Lunes a viernes',
};

// --- Estado central ---

let habitos = cargarHabitos();

// --- Referencias al DOM ---

const formHabito = document.querySelector('#form-habito');
const inputNombre = document.querySelector('#nombre-habito');
const selectFrecuencia = document.querySelector('#frecuencia-habito');
const errorNombre = document.querySelector('#error-nombre');
const ulHabitos = document.querySelector('#ul-habitos');
const estadoVacio = document.querySelector('#estado-vacio');
const fechaHoy = document.querySelector('#fecha-hoy');

// --- Utilidades ---

// Fecha local en "YYYY-MM-DD". No usamos toISOString() porque convierte a
// UTC: de noche podría devolver el día siguiente (o anterior) al local.
function obtenerFechaHoy() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// "Café SOLO " → "cafe solo": descompone tildes (NFD), las elimina y baja a
// minúsculas, para comparar nombres como los compararía una persona.
function normalizarNombre(nombre) {
  return nombre
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// --- Camino único de cambio de estado ---

// Todo cambio en `habitos` termina aquí: así es imposible que la pantalla
// y localStorage cuenten historias distintas.
function persistirYRenderizar() {
  guardarHabitos(habitos);
  renderizarLista();
}

// --- Validación ---

function validarNombre(nombre) {
  if (nombre === '') {
    return 'Escribe un nombre para el hábito.';
  }
  if (nombre.length > LONGITUD_MAXIMA_NOMBRE) {
    return `El nombre no puede superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`;
  }
  const nombreNormalizado = normalizarNombre(nombre);
  const yaExiste = habitos.some(
    (habito) => normalizarNombre(habito.nombre) === nombreNormalizado
  );
  if (yaExiste) {
    return 'Ya tienes un hábito con ese nombre.';
  }
  return null;
}

function mostrarError(mensaje) {
  errorNombre.textContent = mensaje;
  inputNombre.setAttribute('aria-invalid', 'true');
}

function limpiarError() {
  errorNombre.textContent = '';
  inputNombre.removeAttribute('aria-invalid');
}

// --- Render ---

function crearItemHabito(habito) {
  const li = document.createElement('li');
  li.className = 'habito';

  const info = document.createElement('div');
  info.className = 'habito-info';

  const cabecera = document.createElement('div');
  cabecera.className = 'habito-cabecera';

  const nombre = document.createElement('span');
  nombre.className = 'habito-nombre';
  nombre.textContent = habito.nombre;

  const badge = document.createElement('span');
  badge.className = 'badge-frecuencia';
  badge.textContent = ETIQUETAS_FRECUENCIA[habito.frecuencia] ?? habito.frecuencia;

  cabecera.append(nombre, badge);

  const contador = document.createElement('span');
  contador.className = 'habito-contador';
  const total = habito.completados.length;
  contador.textContent =
    total === 1 ? '1 día completado' : `${total} días completados`;

  info.append(cabecera, contador);

  const acciones = document.createElement('div');
  acciones.className = 'habito-acciones';

  const botonCompletar = document.createElement('button');
  botonCompletar.type = 'button';
  botonCompletar.className = 'boton-completar';
  botonCompletar.textContent = 'Completar hoy';
  botonCompletar.setAttribute('aria-label', `Completar hoy: ${habito.nombre}`);
  botonCompletar.dataset.id = habito.id;
  botonCompletar.dataset.accion = 'completar';
  botonCompletar.disabled = true; // próxima etapa

  const botonEliminar = document.createElement('button');
  botonEliminar.type = 'button';
  botonEliminar.className = 'boton-eliminar';
  botonEliminar.textContent = 'Eliminar';
  botonEliminar.setAttribute('aria-label', `Eliminar hábito: ${habito.nombre}`);
  botonEliminar.dataset.id = habito.id;
  botonEliminar.dataset.accion = 'eliminar';

  acciones.append(botonCompletar, botonEliminar);
  li.append(info, acciones);

  return li;
}

function renderizarLista() {
  ulHabitos.replaceChildren(...habitos.map(crearItemHabito));
  estadoVacio.hidden = habitos.length > 0;
}

// --- Acciones sobre el estado ---

function agregarHabito(nombre, frecuencia) {
  const nuevoHabito = {
    id: crypto.randomUUID(),
    nombre,
    frecuencia,
    creadoEl: obtenerFechaHoy(),
    completados: [],
  };
  habitos.push(nuevoHabito);
  persistirYRenderizar();
}

function eliminarHabito(id) {
  const habito = habitos.find((candidato) => candidato.id === id);
  if (!habito) {
    return;
  }
  const confirmado = confirm(
    `¿Eliminar el hábito "${habito.nombre}"? Se perderá su historial.`
  );
  if (!confirmado) {
    return;
  }
  habitos = habitos.filter((candidato) => candidato.id !== id);
  persistirYRenderizar();
}

// --- Eventos ---

formHabito.addEventListener('submit', (evento) => {
  // Sin esto, el submit recarga la página y perderíamos el estado en memoria.
  evento.preventDefault();

  const nombre = inputNombre.value.trim();
  const mensajeError = validarNombre(nombre);

  if (mensajeError !== null) {
    mostrarError(mensajeError);
    inputNombre.focus();
    return;
  }

  limpiarError();
  agregarHabito(nombre, selectFrecuencia.value);
  formHabito.reset();
  inputNombre.focus();
});

// El error desaparece en cuanto el usuario corrige, no en el siguiente submit.
inputNombre.addEventListener('input', limpiarError);

// Delegación: un único listener en el ul atiende los botones de todos los
// items, presentes y futuros, leyendo data-id y data-accion del botón pulsado.
ulHabitos.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton || boton.disabled) {
    return;
  }

  const { id, accion } = boton.dataset;

  if (accion === 'eliminar') {
    eliminarHabito(id);
  }
  // 'completar' llegará en la próxima etapa.
});

// --- Inicio ---

const formateadorFecha = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
fechaHoy.textContent = formateadorFecha.format(new Date());

renderizarLista();
