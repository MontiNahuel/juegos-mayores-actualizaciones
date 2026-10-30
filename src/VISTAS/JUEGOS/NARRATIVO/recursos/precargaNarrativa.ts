/* Prepara las imágenes de la historia y comparte el trabajo de carga. */
import { API_URL } from '../../../../config/api';
import { FONDO_CORTE_DEFAULT, GUARDIAS_CORTE, MANOS_CORTE, ORO_CORTE } from '../../../../config/fondoCorte';
import type { ProgresoCargaNarrativa } from '../../../../store/narrativoCargaSlice';
import marcoEvento from '../../../../assets/narrative/event-title.png';
import caballoCarga from '../../../../assets/narrative/loading-horse.png';
import { esPartidaNarrativaLocal, obtenerSetup, type SetupPartida } from '../narrativeService';
import { ahorraDatos, guardarImagenesEnSegundoPlano, precargarImagenes } from '../../../../services/assetPreloader';

export const CABALLO_CARGA = caballoCarga;
const RECURSOS_INICIALES = [
  FONDO_CORTE_DEFAULT, CABALLO_CARGA, marcoEvento,
  '/assets/narrative/card-frame.png', '/assets/narrative/conversation-title.png',
];
const RECURSOS_FUTUROS = [
  '/assets/narrative/conversation-hall.png', '/assets/narrative/result-paper.png',
  ...GUARDIAS_CORTE.map(/* Prepara el resultado de cada elemento. */ x => x.src), ...MANOS_CORTE.map(/* Prepara el resultado de cada elemento. */ x => x.src), ...ORO_CORTE.map(/* Prepara el resultado de cada elemento. */ x => x.src),
];

// Recorre también respuestas anidadas (estado restaurado, resultados, corte).
export function imagenesDelContenido(contenido: unknown): string[] {
  const urls = new Set<string>();
  // Recorre los datos anidados para encontrar imágenes.
  const visitar = (dato: unknown) => {
    if (!dato || typeof dato !== 'object') return;
    for (const [clave, valor] of Object.entries(dato)) {
      if (clave === 'imagen' && typeof valor === 'string' && valor) {
        urls.add(valor.startsWith('/') && !valor.startsWith('//') ? `${API_URL}${valor}` : valor);
      } else if (typeof valor === 'object') visitar(valor);
    }
  };
  visitar(contenido);
  return [...urls];
}

// Busca las imágenes del universo que pueden aparecer más adelante.
async function imagenesDelUniverso(setup: SetupPartida, date: string) {
  if (esPartidaNarrativaLocal(date)) return [];
  const token = localStorage.getItem('token');
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.tipoUsuario !== 2 && payload.rol !== 2 && payload.tipo_usuario !== 2) {
      return [];
    }
  } catch {
    return [];
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(/* Ejecuta este paso cuando se cumple la espera. */ () => controller.abort(), 10_000);
  try {
    // Los catálogos administrativos solo se consultan para pre-cache si la sesión es de operador
    const catalogos = await Promise.allSettled(['personajes', 'cartas', 'eventos', 'resultados', 'conversaciones', 'finalizaciones'].map(/* Prepara el resultado de cada elemento. */ async nombre => {
      const parametros = new URLSearchParams({ limit: '500', universo_id: setup.universo_id });
      const respuesta = await fetch(`${API_URL}/api/narrative/admin/${nombre}?${parametros}`, {
        signal: controller.signal, headers: { Authorization: `Bearer ${token}` },
      });
      if (!respuesta.ok) return [];
      return respuesta.json();
    }));
    return imagenesDelContenido(catalogos.flatMap(/* Prepara y reúne los resultados de cada elemento. */ resultado => resultado.status === 'fulfilled' ? [resultado.value] : []));
  } finally { clearTimeout(timeout); }
}

interface TrabajoCarga {
  progreso: ProgresoCargaNarrativa;
  oyentes: Set<(progreso: ProgresoCargaNarrativa) => void>;
  promesa: Promise<SetupPartida>;
}
const trabajos = new Map<string, TrabajoCarga>();

// StrictMode y montajes simultáneos comparten el trabajo en curso; cada visita vuelve a consultar el setup.
export function prepararCargaNarrativa(date: string, onProgress: (progreso: ProgresoCargaNarrativa) => void) {
  let trabajo = trabajos.get(date);
  if (!trabajo) {
    // Reparte el avance de carga a las pantallas que están esperando.
    const informar = (progreso: ProgresoCargaNarrativa) => {
      nuevo.progreso = progreso;
      nuevo.oyentes.forEach(/* Aplica este paso a cada elemento. */ oyente => oyente(progreso));
    };
    const nuevo: TrabajoCarga = {
      progreso: { fase: 'preparando', completados: 0, total: 0, fallidos: 0, porcentaje: 0 },
      oyentes: new Set(),
      promesa: Promise.resolve().then(/* Continúa cuando está listo el resultado anterior. */ async () => {
        // Sólo el primer recorrido bloquea la entrada: fondo, baraja, marcos y selección inicial.
        let descubriendo = true;
        const comunes = precargarImagenes(RECURSOS_INICIALES, /* Completa este paso con los datos recibidos por la operación. */ (completados, total, fallidos) => {
          if (descubriendo) informar({ fase: 'preparando', completados, total, fallidos, porcentaje: total ? completados / total * 15 : 0 });
        });
        const setup = await obtenerSetup(date);
        descubriendo = false;
        await comunes;
        await precargarImagenes([...RECURSOS_INICIALES, ...imagenesDelContenido(setup)], /* Completa este paso con los datos recibidos por la operación. */ (completados, total, fallidos) => {
          informar({ fase: 'imagenes', completados, total, fallidos, porcentaje: 15 + (total ? completados / total * 84 : 84) });
        });
        // El resto se guarda en disco sin abrir bitmaps y sin alargar la pantalla de carga.
        guardarImagenesEnSegundoPlano(RECURSOS_FUTUROS);
        if (!ahorraDatos()) void imagenesDelUniverso(setup, date)
          .then(guardarImagenesEnSegundoPlano).catch(/* Maneja el fallo de esta operación. */ () => {});
        return setup;
      }).finally(/* Libera el trabajo pendiente tanto si terminó bien como si falló. */ () => trabajos.delete(date)),
    };
    trabajos.set(date, nuevo);
    trabajo = nuevo;
  }
  trabajo.oyentes.add(onProgress);
  onProgress(trabajo.progreso);
  return { promesa: trabajo.promesa, /* Deja de avisar el progreso a la pantalla que ya salió. */ desconectar: () => trabajo.oyentes.delete(onProgress) };
}
