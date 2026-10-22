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
  ...GUARDIAS_CORTE.map(x => x.src), ...MANOS_CORTE.map(x => x.src), ...ORO_CORTE.map(x => x.src),
];

// Recorre también respuestas anidadas (estado restaurado, resultados, corte).
export function imagenesDelContenido(contenido: unknown): string[] {
  const urls = new Set<string>();
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

async function imagenesDelUniverso(setup: SetupPartida, date: string) {
  if (esPartidaNarrativaLocal(date)) return [];
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  const token = localStorage.getItem('token');
  try {
    // Los catálogos permiten conocer las imágenes de etapas futuras sin adelantar decisiones.
    const catalogos = await Promise.allSettled(['personajes', 'cartas', 'eventos', 'resultados', 'conversaciones', 'finalizaciones'].map(async nombre => {
      const parametros = new URLSearchParams({ limit: '500', universo_id: setup.universo_id });
      const respuesta = await fetch(`${API_URL}/api/narrative/admin/${nombre}?${parametros}`, {
        signal: controller.signal, headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!respuesta.ok) return [];
      return respuesta.json();
    }));
    return imagenesDelContenido(catalogos.flatMap(resultado => resultado.status === 'fulfilled' ? [resultado.value] : []));
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
    const informar = (progreso: ProgresoCargaNarrativa) => {
      nuevo.progreso = progreso;
      nuevo.oyentes.forEach(oyente => oyente(progreso));
    };
    const nuevo: TrabajoCarga = {
      progreso: { fase: 'preparando', completados: 0, total: 0, fallidos: 0, porcentaje: 0 },
      oyentes: new Set(),
      promesa: Promise.resolve().then(async () => {
        // Sólo el primer recorrido bloquea la entrada: fondo, baraja, marcos y selección inicial.
        let descubriendo = true;
        const comunes = precargarImagenes(RECURSOS_INICIALES, (completados, total, fallidos) => {
          if (descubriendo) informar({ fase: 'preparando', completados, total, fallidos, porcentaje: total ? completados / total * 15 : 0 });
        });
        const setup = await obtenerSetup(date);
        descubriendo = false;
        await comunes;
        await precargarImagenes([...RECURSOS_INICIALES, ...imagenesDelContenido(setup)], (completados, total, fallidos) => {
          informar({ fase: 'imagenes', completados, total, fallidos, porcentaje: 15 + (total ? completados / total * 84 : 84) });
        });
        // El resto se guarda en disco sin abrir bitmaps y sin alargar la pantalla de carga.
        guardarImagenesEnSegundoPlano(RECURSOS_FUTUROS);
        if (!ahorraDatos()) void imagenesDelUniverso(setup, date)
          .then(guardarImagenesEnSegundoPlano).catch(() => {});
        return setup;
      }).finally(() => trabajos.delete(date)),
    };
    trabajos.set(date, nuevo);
    trabajo = nuevo;
  }
  trabajo.oyentes.add(onProgress);
  onProgress(trabajo.progreso);
  return { promesa: trabajo.promesa, desconectar: () => trabajo.oyentes.delete(onProgress) };
}
