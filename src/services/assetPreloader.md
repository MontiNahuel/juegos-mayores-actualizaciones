# Precarga de imágenes reutilizable

`assetPreloader.ts` no depende de React, Redux ni de un juego. La pantalla de carga es una vista separada: cada juego decide qué archivos necesita y cómo muestra el progreso.

```ts
import { precargarImagenes, guardarImagenesEnSegundoPlano, imagenPrecargada } from './assetPreloader';

// Esperar únicamente por los recursos de la primera pantalla.
await precargarImagenes(imagenesIniciales, (completados, total, fallidos) => {
  actualizarProgreso({ completados, total, fallidos });
});

// Descargar etapas futuras sin detener la entrada ni decodificarlas en memoria.
guardarImagenesEnSegundoPlano(imagenesFuturas);

// Antes de abrir otra escena, preparar sus imágenes: lee de caché cuando ya existen.
await precargarImagenes(imagenesDeLaEscena);
// Usar esta función tanto en <img src> como en los fondos CSS.
const src = imagenPrecargada(urlOriginal);
```

- Tres trabajos como máximo; el segundo plano ocupa sólo uno y cede la prioridad a recursos visibles.
- CacheStorage guarda imágenes comprimidas hasta 96 MiB. No guarda datos del jugador ni respuestas de la API.
- Las imágenes se revalidan después de 24 horas. Cambiar los assets locales genera otra revisión de caché automáticamente.
- Si la caché está bloqueada o llena, se sigue con la memoria de la sesión y la caché HTTP del navegador.
- El ahorro de datos del dispositivo desactiva las descargas anticipadas de escenas futuras.
- No se conservan todos los bitmaps decodificados; sólo se preparan los recursos que se van a mostrar. El navegador puede liberar esos bitmaps.

En King's Court, `recursos/precargaNarrativa.ts` define las dos listas y consulta la API. `narrativoCargaSlice.ts` conserva únicamente el progreso. `CargaNarrativa.tsx` recibe todos sus datos por props.
