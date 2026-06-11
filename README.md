# Hábitos App

App de seguimiento de hábitos diarios. **En desarrollo.**

Sin frameworks ni build: HTML, CSS y JavaScript (ES Modules). Los datos
persisten en `localStorage` del navegador.

## Estructura

```
habitos-app/
├── index.html        # Estructura semántica de la app
├── css/
│   └── styles.css    # Tokens de diseño y tipografía base
└── js/
    ├── app.js        # Estado, render y eventos
    └── storage.js    # Persistencia (localStorage), sin DOM
```

## Cómo ejecutar

Por usar ES Modules, el `index.html` debe servirse por HTTP (abrir el
archivo directamente con `file://` bloquea los imports). Por ejemplo:

```
npx serve .
# o
python -m http.server
```

## Modelo de datos

```js
{
  id: string,          // identificador único
  nombre: string,      // "Beber 2 litros de agua"
  frecuencia: string,  // "diario" | "lunes-viernes"
  creadoEl: string,    // "YYYY-MM-DD"
  completados: []      // fechas cumplidas: ["2026-06-10", ...]
}
```

## Estado

- [x] Estructura HTML, tokens de diseño y capa de persistencia
- [ ] Crear hábitos desde el formulario
- [ ] Render de la lista y marcado de completados
- [ ] Frecuencia personalizada
