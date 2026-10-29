/* Prepara y guarda imágenes para evitar descargarlas cada vez que cambia la pantalla. */
// Motor compartido por cualquier juego: no depende de React, Redux ni endpoints narrativos.
const PREFIJO_CACHE = 'cognijuegos-imagenes-';
const NOMBRE_CACHE = `${PREFIJO_CACHE}${__ASSET_CACHE_REVISION__}`;
const LIMITE_BYTES = 96 * 1024 * 1024;
const VIGENCIA_MS = 24 * 60 * 60 * 1000;
const ESPERA_MS = 25_000;
const DESCARGAS_SIMULTANEAS = 3;

const imagenes = new Map<string, string>();
const pendientes = new Map<string, { tarea: Promise<boolean>; preparar: boolean }>();
const futuros = new Set<string>();
let guardandoFuturos = false;
const cola: (() => void)[] = [];
let activas = 0;
let bytesMemoria = 0;
let cachePromesa: Promise<Cache | null> | undefined;
let escritura = Promise.resolve();

// Convierte la dirección de la imagen en una dirección completa para identificarla.
const claveUrl = (src: string) => new URL(src, window.location.href).href;

// Los componentes consumen la misma URL blob durante toda la sesión: no redescargan al cambiar de etapa.
export const imagenPrecargada = (src: string) => src ? imagenes.get(claveUrl(src)) || src : src;

// Espera un turno libre para no lanzar demasiadas descargas a la vez.
function enCola<T>(trabajo: () => Promise<T>, prioridad: boolean): Promise<T> {
  return new Promise(/* Resuelve este trabajo pendiente y comunica cuándo terminó. */ (resolve, reject) => {
    // Ocupa un turno de descarga y lo libera cuando termina.
    const iniciar = () => {
      activas++;
      void trabajo().then(resolve, reject).finally(/* Libera el trabajo pendiente tanto si terminó bien como si falló. */ () => {
        activas--;
        cola.shift()?.();
      });
    };
    if (activas < DESCARGAS_SIMULTANEAS) iniciar();
    else if (prioridad) cola.unshift(iniciar);
    else cola.push(iniciar);
  });
}

// Abre la caché de imágenes y retira las versiones viejas.
function abrirCache() {
  return cachePromesa ||= (/* Completa este paso con los datos recibidos por la operación. */ async () => {
    try {
      const cache = await caches.open(NOMBRE_CACHE);
      // La revisión cambia al modificar los assets del proyecto. Sólo se retiran nuestras versiones viejas.
      const nombres = await caches.keys();
      await Promise.all(nombres.filter(/* Conserva los elementos que cumplen esta condición. */ n => n.startsWith(PREFIJO_CACHE) && n !== NOMBRE_CACHE).map(/* Prepara el resultado de cada elemento. */ n => caches.delete(n)));
      return cache;
    } catch {
      // Safari privado o una cuota agotada no impiden jugar: queda la caché HTTP habitual.
      return null;
    }
  })();
}

// Guarda la imagen y hace espacio si se alcanzó el límite.
function guardarEnCache(cache: Cache, url: string, blob: Blob) {
  // Serializar las escrituras mantiene el límite incluso con tres descargas a la vez.
  escritura = escritura.then(/* Continúa cuando está listo el resultado anterior. */ async () => {
    if (blob.size > LIMITE_BYTES) return;
    const anteriores = await cache.keys();
    const tamaños = await Promise.all(anteriores.map(/* Prepara el resultado de cada elemento. */ async key => Number((await cache.match(key))?.headers.get('X-Asset-Bytes') || 0)));
    let bytes = tamaños.reduce(/* Acumula los valores en un solo resultado. */ (total, tamaño) => total + tamaño, 0);
    for (let i = 0; i < anteriores.length && bytes + blob.size > LIMITE_BYTES; i++) {
      await cache.delete(anteriores[i]);
      bytes -= tamaños[i];
    }
    await cache.put(url, new Response(blob, { headers: {
      'Content-Type': blob.type, 'X-Asset-Bytes': String(blob.size), 'X-Asset-Date': String(Date.now()),
    } }));
  }).catch(/* Maneja el fallo de esta operación. */ () => { /* Si no hay espacio, la imagen sigue disponible en esta sesión. */ });
  return escritura;
}

// Prepara la imagen para mostrarla y avisa si pudo abrirse.
function decodificar(src: string): Promise<boolean> {
  return new Promise(/* Resuelve este trabajo pendiente y comunica cuándo terminó. */ resolve => {
    const img = new Image();
    // Cierra la espera de la imagen y devuelve si quedó lista.
    const terminar = (ok: boolean) => {
      clearTimeout(timeout);
      img.onload = img.onerror = null;
      resolve(ok);
    };
    const timeout = window.setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => terminar(false), ESPERA_MS);
    img.onload = /* Completa este paso con los datos recibidos por la operación. */ () => {
      // decode prepara el bitmap antes de retirar el buffer; no conservamos imágenes decodificadas en Redux.
      if (img.decode) void img.decode().then(/* Continúa cuando está listo el resultado anterior. */ () => terminar(true), /* Continúa cuando está listo el resultado anterior. */ () => terminar(img.naturalWidth > 0));
      else terminar(true);
    };
    img.onerror = /* Completa este paso con los datos recibidos por la operación. */ () => terminar(false);
    img.src = src;
  });
}

// Busca la imagen en caché o la descarga y la prepara para mostrarla.
async function cargarImagen(url: string, preparar: boolean): Promise<boolean> {
  const cache = await abrirCache();
  let guardada: Response | undefined;
  try { guardada = await cache?.match(url); } catch { /* Caché no disponible. */ }
  const vigente = guardada && Date.now() - Number(guardada.headers.get('X-Asset-Date')) < VIGENCIA_MS;
  let blob: Blob;
  if (vigente && !preparar) return true;
  if (vigente && guardada) blob = await guardada.blob();
  else {
    const controller = new AbortController();
    const timeout = window.setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => controller.abort(), ESPERA_MS);
    try {
      const respuesta = await fetch(url, { signal: controller.signal, cache: guardada ? 'no-cache' : 'default' });
      // Evita guardar un HTML de error que un servidor haya respondido con estado 200.
      if (!respuesta.ok || !respuesta.headers.get('Content-Type')?.startsWith('image/')) return false;
      blob = await respuesta.blob();
      if (cache) await guardarEnCache(cache, url, blob);
    } catch (error) {
      if (guardada) blob = await guardada.blob();
      else {
        // Un servidor de imágenes sin CORS puede funcionar igualmente mediante <img>.
        if (preparar && error instanceof TypeError && await decodificar(url)) {
          imagenes.set(url, url);
          return true;
        }
        return false;
      }
    } finally { clearTimeout(timeout); }
  }

  // Las escenas futuras quedan comprimidas en disco. Sólo las visibles se decodifican y obtienen una URL blob.
  if (!preparar) return true;
  if (bytesMemoria + blob.size > LIMITE_BYTES || !URL.createObjectURL) return decodificar(url);
  const local = URL.createObjectURL(blob);
  if (!await decodificar(local)) {
    URL.revokeObjectURL(local);
    await cache?.delete(url).catch(/* Maneja el fallo de esta operación. */ () => {});
    return false;
  }
  bytesMemoria += blob.size;
  imagenes.set(url, local);
  return true;
}

// Reutiliza la carga existente o pone la imagen en la cola.
export function asegurarImagen(src: string, preparar = true): Promise<boolean> {
  if (!src || /^(data:|blob:)/.test(src)) return Promise.resolve(true);
  const url = claveUrl(src);
  if (imagenes.has(url)) return Promise.resolve(true);
  const pendiente = pendientes.get(url);
  if (pendiente) {
    return preparar && !pendiente.preparar
      ? pendiente.tarea.then(/* Continúa cuando está listo el resultado anterior. */ () => asegurarImagen(url))
      : pendiente.tarea;
  }
  const tarea = enCola(/* Completa este paso con los datos recibidos por la operación. */ () => cargarImagen(url, preparar), preparar).catch(/* Maneja el fallo de esta operación. */ () => false).finally(/* Libera el trabajo pendiente tanto si terminó bien como si falló. */ () => pendientes.delete(url));
  pendientes.set(url, { tarea, preparar });
  return tarea;
}

// Comprueba si el navegador pide reducir el consumo de datos.
export const ahorraDatos = () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

// Una descarga de futuro a la vez: deja capacidad disponible para las imágenes que el jugador necesita ahora.
export function guardarImagenesEnSegundoPlano(urls: string[]) {
  if (ahorraDatos()) return;
  urls.filter(Boolean).forEach(/* Aplica este paso a cada elemento. */ url => futuros.add(claveUrl(url)));
  if (guardandoFuturos) return;
  guardandoFuturos = true;
  void (/* Completa este paso con los datos recibidos por la operación. */ async () => {
    try {
      while (futuros.size) {
        const url = futuros.values().next().value!;
        futuros.delete(url);
        await asegurarImagen(url, false);
      }
    } finally { guardandoFuturos = false; }
  })();
}

// Prepara las imágenes sin repetir direcciones y avisa cuánto falta.
export async function precargarImagenes(urls: string[], onProgress?: (completados: number, total: number, fallidos: number) => void) {
  const unicas = [...new Set(urls.filter(Boolean).map(claveUrl))];
  let completados = 0;
  let fallidos = 0;
  onProgress?.(0, unicas.length, 0);
  await Promise.all(unicas.map(/* Prepara el resultado de cada elemento. */ async url => {
    if (!await asegurarImagen(url)) fallidos++;
    onProgress?.(++completados, unicas.length, fallidos);
  }));
}
