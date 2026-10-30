import { useState, useEffect, useRef, useMemo } from 'react';
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  LayersIcon,
  PlusIcon,
  RefreshIcon,
  ShieldIcon,
  SparklesIcon,
  TrashIcon,
  XIcon,
} from './Icons';
import { OPERADOR_STORAGE_KEY } from './LoginSistemas';

const API = '/api/challenges/admin/crucigrama/templates';
const TAMANOS = [7, 11];
const DIFICULTAD_POR_TAMANO = { 7: 'facil', 11: 'dificil' };
const ETIQUETA_ESTADO = {
  nuevo: 'Sin guardar',
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada',
};
const ESTILO_ESTADO = {
  nuevo: 'bg-slate-700/60 text-slate-300 border-slate-600',
  draft: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  published: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  archived: 'bg-slate-700/60 text-slate-400 border-slate-600',
};
const MAX_ANCLAS = 2;

function pad2(valor) {
  return String(valor).padStart(2, '0');
}

function aISO(fecha) {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}-${pad2(fecha.getDate())}`;
}

function hoyISO() {
  return aISO(new Date());
}

function mananaISO() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  return aISO(fecha);
}

function crearPatron(n) {
  return Array.from({ length: n }, () => '#'.repeat(n));
}

function generarSemilla() {
  try {
    const valores = crypto.getRandomValues(new Uint32Array(2));
    return `${valores[0].toString(36)}${valores[1].toString(36)}`.slice(0, 12);
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

function palabrasDesdeSolucion(slots, grid) {
  if (!Array.isArray(grid)) return {};
  const palabras = {};
  slots.forEach((slot) => {
    const letras = slot.coords.map(([r, c]) => grid[r]?.[c] || '');
    if (letras.every((letra) => letra && letra !== '#')) {
      palabras[slot.id] = letras.join('');
    }
  });
  return palabras;
}

function formatearFecha(iso) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function leerJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function describirError(data, fallback) {
  const detalle = data && data.detail;
  if (detalle == null) {
    return { mensaje: (data && data.message) || fallback, reporte: null };
  }
  if (typeof detalle === 'string') {
    return { mensaje: detalle, reporte: null };
  }
  if (Array.isArray(detalle)) {
    return {
      mensaje: detalle.map((item) => (item && item.msg) || JSON.stringify(item)).join(' · '),
      reporte: null,
    };
  }
  const errores = Array.isArray(detalle.errors) ? detalle.errors : [];
  const advertencias = Array.isArray(detalle.warnings) ? detalle.warnings : [];
  const mensaje = [detalle.message || fallback, ...errores].filter(Boolean).join(' · ');
  const reporte =
    errores.length || advertencias.length
      ? {
          valid: true,
          solvable: false,
          errors: errores,
          warnings: advertencias,
          attempts: detalle.attempts || 0,
          elapsed_ms: detalle.elapsed_ms,
        }
      : null;
  return { mensaje, reporte };
}

/**
 * Replica el parseo de slots del backend (solver._parse_template_slots):
 * rachas de 2+ letras, ids H_{r}_{c} / V_{r}_{c} y numeración de crucigrama.
 */
function analizarMascara(patron) {
  const R = patron.length;
  const C = R ? patron[0].length : 0;
  const slots = [];

  for (let r = 0; r < R; r += 1) {
    let c = 0;
    while (c < C) {
      if (patron[r][c] !== '#') {
        const inicio = c;
        const coords = [];
        while (c < C && patron[r][c] !== '#') {
          coords.push([r, c]);
          c += 1;
        }
        if (coords.length > 1) {
          slots.push({
            id: `H_${r}_${inicio}`,
            dir: 'H',
            row: r,
            col: inicio,
            length: coords.length,
            coords,
          });
        }
      } else {
        c += 1;
      }
    }
  }

  for (let c = 0; c < C; c += 1) {
    let r = 0;
    while (r < R) {
      if (patron[r][c] !== '#') {
        const inicio = r;
        const coords = [];
        while (r < R && patron[r][c] !== '#') {
          coords.push([r, c]);
          r += 1;
        }
        if (coords.length > 1) {
          slots.push({
            id: `V_${inicio}_${c}`,
            dir: 'V',
            row: inicio,
            col: c,
            length: coords.length,
            coords,
          });
        }
      } else {
        r += 1;
      }
    }
  }

  const cobertura = {};
  slots.forEach((slot) => {
    slot.coords.forEach(([r, c]) => {
      const clave = `${r},${c}`;
      cobertura[clave] = (cobertura[clave] || 0) + 1;
    });
  });
  slots.forEach((slot) => {
    slot.crossings = slot.coords.filter(([r, c]) => cobertura[`${r},${c}`] > 1).length;
  });

  const numeros = {};
  let numero = 1;
  const esLetra = (r, c) => r >= 0 && r < R && c >= 0 && c < C && patron[r][c] !== '#';
  for (let r = 0; r < R; r += 1) {
    for (let c = 0; c < C; c += 1) {
      if (!esLetra(r, c)) continue;
      const iniciaH = !esLetra(r, c - 1) && esLetra(r, c + 1);
      const iniciaV = !esLetra(r - 1, c) && esLetra(r + 1, c);
      if (iniciaH || iniciaV) {
        numeros[`${r},${c}`] = numero;
        numero += 1;
      }
    }
  }

  return { R, C, slots, numeros };
}

export default function ModalDisenadorCrucigrama({ abierto, onCerrar }) {
  const [vista, setVista] = useState('editor');
  const [tamano, setTamano] = useState(7);
  const [patron, setPatron] = useState(() => crearPatron(7));
  const [nombre, setNombre] = useState('');
  const [tema, setTema] = useState('Palabras Cruzadas');
  const [dificultad, setDificultad] = useState('facil');
  const [anclas, setAnclas] = useState({});
  const [plantillaId, setPlantillaId] = useState(null);
  const [estado, setEstado] = useState('nuevo');
  const [fechaAgenda, setFechaAgenda] = useState(() => mananaISO());
  const [agendar, setAgendar] = useState(true);
  const [diaRecurrente, setDiaRecurrente] = useState('');
  const [reporte, setReporte] = useState(null);
  const [solucion, setSolucion] = useState(null);
  const [palabrasSolucion, setPalabrasSolucion] = useState({});
  const [verSolucion, setVerSolucion] = useState(false);
  const [slotSel, setSlotSel] = useState(null);
  const [anclaTexto, setAnclaTexto] = useState('');
  const [textoMascara, setTextoMascara] = useState('');
  const [semilla, setSemilla] = useState(() => generarSemilla());
  const [vetadas, setVetadas] = useState([]);
  const [vetosGlobales, setVetosGlobales] = useState([]);
  const [nuevoVetoGlobal, setNuevoVetoGlobal] = useState('');
  const [guardandoVetos, setGuardandoVetos] = useState(false);
  const [pistas, setPistas] = useState({});
  const [palabraEditando, setPalabraEditando] = useState(null);
  const [reemplazoTexto, setReemplazoTexto] = useState('');
  const [cargandoPista, setCargandoPista] = useState(null);
  const [cargandoPistas, setCargandoPistas] = useState(false);
  const [nota, setNota] = useState('');
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [validando, setValidando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [fechaAplicar, setFechaAplicar] = useState(() => mananaISO());
  const [aplicando, setAplicando] = useState(false);
  const [planillas, setPlanillas] = useState([]);
  const [cargandoPlanillas, setCargandoPlanillas] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [errorPlanillas, setErrorPlanillas] = useState('');
  const [aplicarId, setAplicarId] = useState(null);
  const [aplicarFecha, setAplicarFecha] = useState(() => mananaISO());
  const [aplicandoId, setAplicandoId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const pinturaRef = useRef(null);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
      const token = sesion ? JSON.parse(sesion)?.token : null;
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      /* sesión ilegible: se envía sin token */
    }
    return headers;
  };

  const analisis = useMemo(() => analizarMascara(patron), [patron]);
  const slots = analisis.slots;
  const slotActual = slots.find((slot) => slot.id === slotSel) || null;
  const bloqueado = estado === 'published';
  const celdaPx = analisis.C >= 11 ? 34 : 44;

  const letraPorCelda = useMemo(() => {
    const mapa = {};
    Object.entries(anclas).forEach(([id, palabra]) => {
      const slot = slots.find((item) => item.id === id);
      if (!slot) return;
      slot.coords.forEach(([r, c], indice) => {
        mapa[`${r},${c}`] = palabra[indice];
      });
    });
    return mapa;
  }, [anclas, slots]);

  const limpiarSolucion = () => {
    setReporte(null);
    setSolucion(null);
    setPalabrasSolucion({});
    setVerSolucion(false);
    setPalabraEditando(null);
    setReemplazoTexto('');
  };

  useEffect(() => {
    const soltar = () => {
      pinturaRef.current = null;
    };
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    return () => {
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
    };
  }, []);

  // La máscara puede invalidar anclas existentes (slot eliminado o distinto largo).
  useEffect(() => {
    const largos = new Map(analisis.slots.map((slot) => [slot.id, slot.length]));
    const vigentes = {};
    let quitadas = 0;
    Object.entries(anclas).forEach(([id, palabra]) => {
      if (largos.get(id) === palabra.length) vigentes[id] = palabra;
      else quitadas += 1;
    });
    if (quitadas > 0) {
      setAnclas(vigentes);
      setAviso(`Se quitaron ${quitadas} ancla(s) porque la máscara ya no las admite.`);
    }
    if (slotSel && !largos.has(slotSel)) setSlotSel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patron]);

  useEffect(() => {
    if (abierto) cargarPlantillas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, filtroEstado]);

  useEffect(() => {
    if (abierto) cargarVetosGlobales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const cargarPlantillas = async () => {
    setCargandoPlanillas(true);
    setErrorPlanillas('');
    try {
      const query = filtroEstado ? `?status=${filtroEstado}` : '';
      const res = await fetch(`${API}${query}`, { headers: getAuthHeaders() });
      const data = await leerJson(res);
      if (!res.ok) {
        setErrorPlanillas(describirError(data, 'No se pudieron cargar las plantillas.').mensaje);
        return;
      }
      setPlanillas(data.items || []);
    } catch {
      setErrorPlanillas('Error de conexión al listar las plantillas.');
    } finally {
      setCargandoPlanillas(false);
    }
  };

  const cargarVetosGlobales = async () => {
    try {
      const res = await fetch(`${API}/global-bans`, { headers: getAuthHeaders() });
      const data = await leerJson(res);
      if (res.ok && Array.isArray(data?.banned_words)) {
        setVetosGlobales(data.banned_words);
      }
    } catch {
      /* bloque de vetos globales: se reintenta al reabrir el modal */
    }
  };

  const guardarVetosGlobales = async (siguientes) => {
    setGuardandoVetos(true);
    setError('');
    try {
      const res = await fetch(`${API}/global-bans`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ banned_words: siguientes }),
      });
      const data = await leerJson(res);
      if (!res.ok) {
        setError(
          describirError(data, 'No se pudieron guardar los vetos globales.').mensaje
        );
        return false;
      }
      setVetosGlobales(data.banned_words || []);
      return true;
    } catch {
      setError('Error de conexión al guardar los vetos globales.');
      return false;
    } finally {
      setGuardandoVetos(false);
    }
  };

  const agregarVetoGlobal = async () => {
    const palabra = nuevoVetoGlobal.trim().toUpperCase();
    if (!palabra || guardandoVetos) return;
    if (palabra.length < 3 || palabra.length > 10 || !/^[A-ZÑÁÉÍÓÚÜ]+$/.test(palabra)) {
      setError('La palabra debe tener entre 3 y 10 letras (sin espacios ni números).');
      return;
    }
    if (vetosGlobales.includes(palabra)) {
      setNuevoVetoGlobal('');
      return;
    }
    const ok = await guardarVetosGlobales([...vetosGlobales, palabra]);
    if (!ok) return;
    setNuevoVetoGlobal('');
    const afectaSolucion = Object.values(palabrasSolucion).includes(palabra);
    if (afectaSolucion && !bloqueado) validarMascara();
  };

  const quitarVetoGlobal = async (palabra) => {
    if (guardandoVetos) return;
    await guardarVetosGlobales(vetosGlobales.filter((item) => item !== palabra));
  };

  const aplicarDetalle = (detalle) => {
    const filas = Array.isArray(detalle.pattern) && detalle.pattern.length
      ? detalle.pattern
      : crearPatron(detalle.size || 7);
    setPlantillaId(detalle.id);
    setEstado(detalle.status);
    setNombre(detalle.name || '');
    setTema(detalle.theme || 'Palabras Cruzadas');
    setPatron(filas);
    setTamano(filas.length);
    setDificultad(detalle.difficulty || 'facil');
    setAnclas(detalle.anchors || {});
    setFechaAgenda(detalle.scheduled_date || mananaISO());
    setAgendar(Boolean(detalle.scheduled_date));
    setDiaRecurrente(detalle.monthly_day || '');
    setVetadas(detalle.banned_words || []);
    setPistas(detalle.clue_overrides || {});
    setSemilla(detalle.last_seed || generarSemilla());
    setSolucion(detalle.solution_grid || null);
    setPalabrasSolucion(
      detalle.solution_grid
        ? palabrasDesdeSolucion(analizarMascara(filas).slots, detalle.solution_grid)
        : {}
    );
    setReporte(null);
    setVerSolucion(false);
    setSlotSel(null);
    setAnclaTexto('');
    setPalabraEditando(null);
    setReemplazoTexto('');
    setTextoMascara(filas.join('\n'));
  };

  const reiniciarEditor = () => {
    setPlantillaId(null);
    setEstado('nuevo');
    setNombre('');
    setTema('Palabras Cruzadas');
    setDificultad(DIFICULTAD_POR_TAMANO[tamano] || 'facil');
    setPatron(crearPatron(tamano));
    setAnclas({});
    setFechaAgenda(mananaISO());
    setAgendar(true);
    setDiaRecurrente('');
    setSemilla(generarSemilla());
    setVetadas([]);
    setPistas({});
    setReporte(null);
    setSolucion(null);
    setPalabrasSolucion({});
    setVerSolucion(false);
    setSlotSel(null);
    setAnclaTexto('');
    setPalabraEditando(null);
    setReemplazoTexto('');
    setTextoMascara('');
    setNota('');
    setAviso('');
    setError('');
  };

  const cambiarTamano = (nuevo) => {
    if (nuevo === tamano) return;
    setTamano(nuevo);
    setDificultad(DIFICULTAD_POR_TAMANO[nuevo] || 'facil');
    setPatron(crearPatron(nuevo));
    setAnclas({});
    setSemilla(generarSemilla());
    setVetadas([]);
    setPistas({});
    setReporte(null);
    setSolucion(null);
    setPalabrasSolucion({});
    setVerSolucion(false);
    setSlotSel(null);
    setPalabraEditando(null);
    setReemplazoTexto('');
    setPlantillaId(null);
    setEstado('nuevo');
    setNombre('');
    setAviso('');
    setError('');
    setNota('Máscara nueva: los cambios anteriores no se guardaron.');
  };

  const aplicarCelda = (r, c) => {
    const pintura = pinturaRef.current;
    if (!pintura) return;
    setPatron((previo) => {
      if (previo[r][c] === pintura.valor) return previo;
      const fila = previo[r].slice(0, c) + pintura.valor + previo[r].slice(c + 1);
      const copia = previo.slice();
      copia[r] = fila;
      return copia;
    });
    limpiarSolucion();
  };

  const iniciarPintura = (r, c, valorActual) => {
    pinturaRef.current = { valor: valorActual === '#' ? '.' : '#' };
    aplicarCelda(r, c);
  };

  const vaciarMascara = () => {
    setPatron(crearPatron(tamano));
    setAnclas({});
    setVetadas([]);
    setPistas({});
    limpiarSolucion();
    setSlotSel(null);
    setAviso('');
  };

  const invertirMascara = () => {
    setPatron((previo) =>
      previo.map((fila) => fila.split('').map((ch) => (ch === '#' ? '.' : '#')).join(''))
    );
    setVetadas([]);
    setPistas({});
    limpiarSolucion();
    setAviso('');
  };

  const exportarMascara = async () => {
    const texto = patron.join('\n');
    setTextoMascara(texto);
    try {
      await navigator.clipboard.writeText(texto);
      setNota('Máscara copiada al portapapeles.');
    } catch {
      setNota('Máscara cargada en el cuadro de texto.');
    }
  };

  const importarMascara = () => {
    const lineas = textoMascara
      .split(/\r?\n/)
      .map((linea) => linea.replace(/\s+/g, ''))
      .filter(Boolean);
    if (!lineas.length) {
      setError('Pegá al menos una fila de la máscara.');
      return;
    }
    const ancho = Math.max(...lineas.map((linea) => linea.length));
    if (!TAMANOS.includes(ancho)) {
      setError(`El ancho debe ser 7 u 11 (detectado: ${ancho}).`);
      return;
    }
    if (lineas.length !== ancho) {
      setError(`La máscara debe ser cuadrada ${ancho}×${ancho} (recibidas ${lineas.length} filas).`);
      return;
    }
    const filas = lineas.map((linea) => linea.padEnd(ancho, '#'));
    const invalidos = new Set();
    filas.forEach((fila) => {
      [...fila].forEach((ch) => {
        if (ch !== '.' && ch !== '#') invalidos.add(ch);
      });
    });
    if (invalidos.size) {
      setError(`Caracteres inválidos: ${[...invalidos].join(', ')}. Usá "." para letras y "#" para bloques.`);
      return;
    }
    setTamano(ancho);
    setDificultad(DIFICULTAD_POR_TAMANO[ancho]);
    setPatron(filas);
    setAnclas({});
    setSemilla(generarSemilla());
    setVetadas([]);
    setPistas({});
    limpiarSolucion();
    setSlotSel(null);
    setPlantillaId(null);
    setEstado('nuevo');
    setAviso('');
    setError('');
    setNota('Máscara importada. Guardala como borrador para persistirla.');
  };

  const agregarAncla = () => {
    if (!slotActual) return;
    const palabra = anclaTexto.trim().toUpperCase();
    if (palabra.length !== slotActual.length) {
      setError(`El ancla debe tener ${slotActual.length} letras (tiene ${palabra.length}).`);
      return;
    }
    if (!/^[A-ZÑ]+$/.test(palabra)) {
      setError('El ancla solo admite letras (sin espacios ni números).');
      return;
    }
    setAnclas((previo) => ({ ...previo, [slotActual.id]: palabra }));
    setAnclaTexto('');
    setError('');
    limpiarSolucion();
  };

  const quitarAncla = (id) => {
    setAnclas((previo) => {
      const siguiente = { ...previo };
      delete siguiente[id];
      return siguiente;
    });
    limpiarSolucion();
  };

  const validarMascara = async ({ seed, fijadas, vetadas: vetadasOverride } = {}) => {
    const semillaUsada = seed || semilla || generarSemilla();
    const fijadasUsadas = fijadas || {};
    const vetadasUsadas = vetadasOverride || vetadas;
    setValidando(true);
    setError('');
    setNota('');
    setAviso('');
    setReporte(null);
    try {
      const res = await fetch(`${API}/validate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          pattern: patron,
          anchors: anclas,
          difficulty: dificultad,
          fixed_words: fijadasUsadas,
          banned_words: vetadasUsadas,
          seed: semillaUsada,
        }),
      });
      const data = await leerJson(res);
      if (!res.ok) {
        setError(describirError(data, 'No se pudo validar la máscara.').mensaje);
        return;
      }
      setReporte(data);
      setSemilla(semillaUsada);
      if (Array.isArray(data.banned_words)) setVetadas(data.banned_words);
      if (data.solvable && data.solution) {
        setSolucion(data.solution);
        setPalabrasSolucion(
          data.solution_words || palabrasDesdeSolucion(slots, data.solution)
        );
        setVerSolucion(true);
      } else {
        setSolucion(null);
        setPalabrasSolucion({});
      }
      setPalabraEditando(null);
      setReemplazoTexto('');
    } catch {
      setError('Error de conexión al validar la máscara.');
    } finally {
      setValidando(false);
    }
  };

  const vetarPalabra = (palabra) => {
    if (!palabra || vetadas.includes(palabra) || bloqueado) return;
    const siguientes = [...vetadas, palabra];
    setVetadas(siguientes);
    validarMascara({ vetadas: siguientes, seed: generarSemilla() });
  };

  const vetarPalabraGlobal = async (palabra) => {
    if (!palabra || guardandoVetos || bloqueado) return;
    if (vetosGlobales.includes(palabra)) {
      setNota(`'${palabra}' ya está vetada en todos los tableros.`);
      return;
    }
    const ok = await guardarVetosGlobales([...vetosGlobales, palabra]);
    if (!ok) return;
    await validarMascara();
    setNota(`'${palabra}' vetada en todos los tableros.`);
  };

  const quitarVeto = (palabra) => {
    setVetadas((previo) => previo.filter((item) => item !== palabra));
  };

  const iniciarReemplazo = (slotId, palabra) => {
    if (bloqueado) return;
    setPalabraEditando(slotId);
    setReemplazoTexto(palabra || '');
    setError('');
  };

  const cancelarReemplazo = () => {
    setPalabraEditando(null);
    setReemplazoTexto('');
  };

  const confirmarReemplazo = (slot) => {
    const palabra = reemplazoTexto.trim().toUpperCase();
    if (palabra.length !== slot.length || !/^[A-ZÑ]+$/.test(palabra)) {
      setError(`La palabra debe tener ${slot.length} letras (sin espacios ni números).`);
      return;
    }
    setError('');
    setPalabraEditando(null);
    setReemplazoTexto('');
    validarMascara({ fijadas: { [slot.id]: palabra }, seed: generarSemilla() });
  };

  const buscarPistaRae = async (palabra) => {
    if (!palabra) return;
    setCargandoPista(palabra);
    setError('');
    try {
      const res = await fetch(`${API}/dictionary/${encodeURIComponent(palabra)}`, {
        headers: getAuthHeaders(),
      });
      const data = await leerJson(res);
      if (!res.ok) {
        setError(describirError(data, 'No se pudo consultar la RAE.').mensaje);
        return;
      }
      if (data.definition) {
        setPistas((previo) => ({ ...previo, [palabra]: data.definition }));
      } else {
        setAviso(`La RAE no devolvió una definición para '${palabra}'.`);
      }
    } catch {
      setError('Error de conexión al consultar la RAE.');
    } finally {
      setCargandoPista(null);
    }
  };

  const traerPistasRae = async () => {
    const pendientes = Object.values(palabrasSolucion).filter((palabra) => !pistas[palabra]);
    if (!pendientes.length) {
      setNota('Todas las palabras de la solución ya tienen pista.');
      return;
    }
    setCargandoPistas(true);
    setError('');
    try {
      const res = await fetch(`${API}/dictionary`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ words: pendientes }),
      });
      const data = await leerJson(res);
      if (!res.ok) {
        setError(describirError(data, 'No se pudieron consultar las pistas en la RAE.').mensaje);
        return;
      }
      const definiciones = data.definitions || {};
      setPistas((previo) => ({ ...previo, ...definiciones }));
      const faltantes = data.missing || [];
      setNota(
        `Pistas RAE cargadas: ${Object.keys(definiciones).length} de ${pendientes.length}${
          faltantes.length ? `. Sin definición: ${faltantes.join(', ')}.` : '.'
        }`
      );
    } catch {
      setError('Error de conexión al consultar la RAE.');
    } finally {
      setCargandoPistas(false);
    }
  };

  const guardarPlantilla = async ({ silencioso = false } = {}) => {
    if (!nombre.trim()) {
      setError('Poné un nombre para la plantilla antes de guardar.');
      return null;
    }
    if (estado === 'published') {
      setError('La plantilla está publicada: archivala antes de editarla.');
      return null;
    }
    if (agendar && !fechaAgenda) {
      setError('Elegí la fecha de agendado o desactivá "Agendar al publicar".');
      return null;
    }
    setGuardando(true);
    if (!silencioso) {
      setError('');
      setNota('');
      setAviso('');
    }
    try {
      const payload = {
        name: nombre.trim(),
        theme: tema.trim() || 'Palabras Cruzadas',
        pattern: patron,
        difficulty: dificultad,
        anchors: anclas,
        banned_words: vetadas,
        clue_overrides: pistas,
        scheduled_date: agendar ? fechaAgenda : null,
        monthly_day: diaRecurrente ? Number(diaRecurrente) : null,
      };
      const res = await fetch(plantillaId ? `${API}/${plantillaId}` : API, {
        method: plantillaId ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await leerJson(res);
      if (!res.ok) {
        setError(describirError(data, 'No se pudo guardar la plantilla.').mensaje);
        return null;
      }
      setPlantillaId(data.id);
      setEstado(data.status);
      if (!silencioso) {
        setNota(`Plantilla guardada (${data.id}) como ${ETIQUETA_ESTADO[data.status] || data.status}.`);
      }
      cargarPlantillas();
      return data.id;
    } catch {
      setError('Error de conexión al guardar la plantilla.');
      return null;
    } finally {
      setGuardando(false);
    }
  };

  const publicarPlantilla = async () => {
    setPublicando(true);
    setError('');
    setNota('');
    setAviso('');
    const id = await guardarPlantilla({ silencioso: true });
    if (!id) {
      setPublicando(false);
      return;
    }
    try {
      const res = await fetch(`${API}/${id}/publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          scheduled_date: agendar ? fechaAgenda : null,
          monthly_day: diaRecurrente ? Number(diaRecurrente) : null,
          solution_grid: solucion || undefined,
          seed: semilla,
          banned_words: vetadas,
        }),
      });
      const data = await leerJson(res);
      if (!res.ok) {
        const descripcion = describirError(data, 'No se pudo publicar la plantilla.');
        setError(descripcion.mensaje);
        if (descripcion.reporte) setReporte(descripcion.reporte);
        return;
      }
      aplicarDetalle(data.template);
      const destino = data.applied_to;
      setNota(
        destino
          ? `Publicada y aplicada al ${destino.date} con ${destino.total_words} palabras${
              destino.overwritten ? ' (sobrescribió el desafío existente)' : ''
            }.`
          : 'Plantilla publicada. Podés aplicarla a una fecha desde la pestaña Plantillas.'
      );
      cargarPlantillas();
    } catch {
      setError('Error de conexión al publicar la plantilla.');
    } finally {
      setPublicando(false);
    }
  };

  const archivarPlantilla = async (id) => {
    setError('');
    setNota('');
    try {
      const res = await fetch(`${API}/${id}/archive`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await leerJson(res);
      if (!res.ok) {
        setError(describirError(data, 'No se pudo archivar la plantilla.').mensaje);
        return;
      }
      if (plantillaId === id) aplicarDetalle(data);
      setNota('Plantilla archivada. Ya se puede editar y volver a publicar.');
      cargarPlantillas();
    } catch {
      setError('Error de conexión al archivar la plantilla.');
    }
  };

  const eliminarPlantilla = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    setError('');
    setNota('');
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await leerJson(res);
      if (!res.ok) {
        setError(describirError(data, 'No se pudo eliminar la plantilla.').mensaje);
        return;
      }
      if (plantillaId === id) reiniciarEditor();
      setNota('Plantilla eliminada.');
      cargarPlantillas();
    } catch {
      setError('Error de conexión al eliminar la plantilla.');
    }
  };

  const abrirPlantilla = async (id) => {
    setError('');
    setNota('');
    try {
      const res = await fetch(`${API}/${id}`, { headers: getAuthHeaders() });
      const data = await leerJson(res);
      if (!res.ok) {
        setError(describirError(data, 'No se pudo abrir la plantilla.').mensaje);
        return;
      }
      aplicarDetalle(data);
      setVista('editor');
    } catch {
      setError('Error de conexión al abrir la plantilla.');
    }
  };

  const aplicarPlantillaAFecha = async (id, fecha) => {
    if (!fecha) {
      setError('Elegí una fecha para aplicar la plantilla.');
      return;
    }
    setAplicandoId(id);
    setError('');
    setNota('');
    try {
      const res = await fetch(`${API}/${id}/apply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: fecha, force: true }),
      });
      const data = await leerJson(res);
      if (!res.ok) {
        setError(describirError(data, 'No se pudo aplicar la plantilla.').mensaje);
        return;
      }
      setNota(
        `Plantilla aplicada al ${data.date} con ${data.total_words} palabras${
          data.overwritten ? ' (sobrescribió el desafío existente)' : ''
        }.`
      );
      setAplicarId(null);
      cargarPlantillas();
    } catch {
      setError('Error de conexión al aplicar la plantilla.');
    } finally {
      setAplicandoId(null);
      setAplicando(false);
    }
  };

  const aplicarPublicada = async () => {
    if (!plantillaId) return;
    setAplicando(true);
    await aplicarPlantillaAFecha(plantillaId, fechaAplicar);
  };

  if (!abierto) return null;

  const bloques = patron.join('').split('').filter((ch) => ch === '#').length;
  const palabrasTres = slots.filter((slot) => slot.length === 3).length;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-950/95 backdrop-blur-md text-slate-100">
      <header className="shrink-0 border-b border-slate-800 bg-slate-900/80 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <LayersIcon size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white leading-tight">
                Diseñador de Máscaras de Crucigrama
              </h2>
              <p className="text-xs text-slate-400">
                Dibujá la máscara, fijá anclas y el solver resuelve el tablero
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-800/80 border border-slate-700">
              <button
                type="button"
                onClick={() => setVista('editor')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  vista === 'editor'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setVista('plantillas')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  vista === 'plantillas'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Plantillas
              </button>
            </div>

            <button
              type="button"
              onClick={onCerrar}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-100 transition cursor-pointer"
              title="Volver a Desafíos Diarios"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-start gap-2">
              <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {aviso && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-start gap-2">
              <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
              <span>{aviso}</span>
            </div>
          )}
          {nota && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-start gap-2">
              <CheckIcon size={16} className="mt-0.5 shrink-0" />
              <span>{nota}</span>
            </div>
          )}

          {vista === 'editor' ? (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
              <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-800/80 border border-slate-700">
                    {TAMANOS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => cambiarTamano(n)}
                        disabled={bloqueado}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          tamano === n
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {n} × {n}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      {slots.length} palabras
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full border ${
                        palabrasTres > 6
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {palabrasTres} de 3 letras
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      {bloques} bloques
                    </span>
                  </div>
                </div>

                {bloqueado && (
                  <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
                    Plantilla publicada: la máscara está bloqueada. Archivala para volver a editarla.
                  </div>
                )}

                <div className="flex justify-center">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                    <div
                      className={`select-none ${bloqueado ? 'opacity-80' : 'touch-none'}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${analisis.C}, ${celdaPx}px)`,
                      }}
                    >
                      {patron.map((fila, r) =>
                        fila.split('').map((ch, c) => {
                          const clave = `${r},${c}`;
                          const esBloque = ch === '#';
                          const numero = analisis.numeros[clave];
                          const enSlot = Boolean(
                            slotActual &&
                              slotActual.coords.some(([sr, sc]) => sr === r && sc === c)
                          );
                          const letraSolucion =
                            verSolucion && solucion && solucion[r] ? solucion[r][c] : null;
                          const letraAncla = letraPorCelda[clave];
                          return (
                            <button
                              key={clave}
                              type="button"
                              onPointerDown={
                                bloqueado
                                  ? undefined
                                  : (event) => {
                                      event.preventDefault();
                                      iniciarPintura(r, c, ch);
                                    }
                              }
                              onPointerEnter={
                                bloqueado
                                  ? undefined
                                  : () => {
                                      if (pinturaRef.current) aplicarCelda(r, c);
                                    }
                              }
                              onKeyDown={
                                bloqueado
                                  ? undefined
                                  : (event) => {
                                      if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        pinturaRef.current = { valor: esBloque ? '.' : '#' };
                                        aplicarCelda(r, c);
                                        pinturaRef.current = null;
                                      }
                                    }
                              }
                              className={`relative flex items-center justify-center border transition-colors ${
                                esBloque
                                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                  : enSlot
                                  ? 'bg-amber-200 border-amber-400 text-slate-900'
                                  : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-white'
                              } ${bloqueado ? 'cursor-default' : 'cursor-pointer'}`}
                              style={{ width: celdaPx, height: celdaPx }}
                              aria-label={`Fila ${r + 1}, columna ${c + 1}${
                                esBloque ? ', bloque' : ', letra'
                              }`}
                            >
                              {numero && (
                                <span className="absolute top-0.5 left-1 text-[9px] font-bold leading-none text-slate-500">
                                  {numero}
                                </span>
                              )}
                              {!esBloque && letraSolucion && (
                                <span className="text-sm font-black">{letraSolucion}</span>
                              )}
                              {!esBloque && !letraSolucion && letraAncla && (
                                <span className="text-sm font-black text-amber-700">{letraAncla}</span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={vaciarMascara}
                    disabled={bloqueado}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Vaciar (todo bloque)
                  </button>
                  <button
                    type="button"
                    onClick={invertirMascara}
                    disabled={bloqueado}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Invertir celdas
                  </button>
                  <button
                    type="button"
                    onClick={exportarMascara}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <CopyIcon size={13} />
                    Copiar máscara
                  </button>
                  {solucion && (
                    <button
                      type="button"
                      onClick={() => setVerSolucion((previo) => !previo)}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                        verSolucion
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                    >
                      {verSolucion ? 'Ocultar solución' : 'Ver solución'}
                    </button>
                  )}
                </div>

                <details className="mt-4 group">
                  <summary className="text-[11px] font-bold text-slate-400 cursor-pointer hover:text-slate-200 transition">
                    Importar / exportar máscara como texto («.» letra, «#» bloque)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={textoMascara}
                      onChange={(event) => setTextoMascara(event.target.value)}
                      rows={8}
                      spellCheck={false}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                      placeholder={'#..###\n#..###\n...###\n...###\n###...\n###..##\n###..##'}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={importarMascara}
                        disabled={bloqueado}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Importar texto
                      </button>
                      <span className="text-[10px] text-slate-500">
                        El texto reemplaza la máscara actual y reinicia anclas.
                      </span>
                    </div>
                  </div>
                </details>

                {solucion && Object.keys(palabrasSolucion).length > 0 && (
                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-sm font-black text-white">Solución y pistas</h3>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          Reemplazá o vetá palabras y ajustá la pista que verá el jugador.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={traerPistasRae}
                        disabled={cargandoPistas}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Consultar definiciones RAE para las palabras sin pista"
                      >
                        <SparklesIcon size={13} />
                        {cargandoPistas ? 'Consultando RAE…' : 'Pistas RAE faltantes'}
                      </button>
                    </div>

                    {vetadas.length > 0 && (
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500">Vetadas:</span>
                        {vetadas.map((palabra) => (
                          <span
                            key={palabra}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-300"
                          >
                            {palabra}
                            {!bloqueado && (
                              <button
                                type="button"
                                onClick={() => quitarVeto(palabra)}
                                className="text-rose-400 hover:text-rose-200 cursor-pointer"
                                aria-label={`Quitar veto de ${palabra}`}
                              >
                                <XIcon size={10} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1.5 max-h-[430px] overflow-y-auto pr-1">
                      {slots.map((slot) => {
                        const palabra = palabrasSolucion[slot.id];
                        if (!palabra) return null;
                        const numero = analisis.numeros[`${slot.row},${slot.col}`];
                        const editando = palabraEditando === slot.id;
                        return (
                          <div
                            key={slot.id}
                            className="rounded-xl border border-slate-800 bg-slate-950/60 p-2"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-400">
                                {slot.dir} #{numero}
                              </span>
                              <span className="font-mono text-[12px] font-black tracking-wide text-amber-200">
                                {palabra}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {slot.length} letras
                              </span>
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => buscarPistaRae(palabra)}
                                  disabled={cargandoPista === palabra}
                                  className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Buscar definición en la RAE"
                                >
                                  {cargandoPista === palabra ? '…' : 'RAE'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => iniciarReemplazo(slot.id, palabra)}
                                  disabled={bloqueado}
                                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Fijar otra palabra en este slot y re-resolver"
                                >
                                  Cambiar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => vetarPalabra(palabra)}
                                  disabled={bloqueado}
                                  className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Excluir esta palabra y re-resolver"
                                >
                                  Vetar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => vetarPalabraGlobal(palabra)}
                                  disabled={bloqueado || guardandoVetos}
                                  className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/60 text-rose-200 text-[10px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Excluir esta palabra de todos los tableros y re-resolver"
                                >
                                  Vetar Global
                                </button>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={pistas[palabra] || ''}
                              onChange={(event) =>
                                setPistas((previo) => ({
                                  ...previo,
                                  [palabra]: event.target.value,
                                }))
                              }
                              maxLength={240}
                              placeholder="Pista automática (RAE si hay definición)"
                              className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-amber-400"
                            />

                            {editando && (
                              <div className="mt-1.5">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={reemplazoTexto}
                                    onChange={(event) =>
                                      setReemplazoTexto(
                                        event.target.value
                                          .replace(/[^A-Za-zÑñÁÉÍÓÚÜáéíóúü]/g, '')
                                          .toUpperCase()
                                      )
                                    }
                                    maxLength={slot.length}
                                    autoFocus
                                    placeholder={'X'.repeat(slot.length)}
                                    className="flex-1 rounded-lg bg-slate-900 border border-amber-500/50 px-2 py-1.5 text-[11px] font-black tracking-[0.2em] text-amber-200 focus:outline-none focus:border-amber-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => confirmarReemplazo(slot)}
                                    disabled={reemplazoTexto.length !== slot.length}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Fijar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelarReemplazo}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                                <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                                  Se fija «{palabra}» temporalmente, se resuelve el resto con otra
                                  semilla y la solución queda lista para publicar.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              <aside className="space-y-4">
                <section className="bg-slate-900/80 border border-amber-500/25 rounded-3xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-white inline-flex items-center gap-1.5">
                      <ShieldIcon size={14} className="text-amber-300" />
                      Vetos globales
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      {vetosGlobales.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2 leading-snug">
                    Palabras excluidas de todos los tableros, en el diseñador y en la
                    generación mensual.
                  </p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <input
                      type="text"
                      value={nuevoVetoGlobal}
                      onChange={(event) => setNuevoVetoGlobal(event.target.value.toUpperCase())}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          agregarVetoGlobal();
                        }
                      }}
                      maxLength={10}
                      placeholder="Palabra…"
                      className="flex-1 min-w-0 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 uppercase focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={agregarVetoGlobal}
                      disabled={guardandoVetos || !nuevoVetoGlobal.trim()}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {guardandoVetos ? '…' : 'Agregar'}
                    </button>
                  </div>
                  {vetosGlobales.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {vetosGlobales.map((palabra) => (
                        <span
                          key={palabra}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-200"
                        >
                          {palabra}
                          <button
                            type="button"
                            onClick={() => quitarVetoGlobal(palabra)}
                            disabled={guardandoVetos}
                            className="text-amber-300 hover:text-amber-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label={`Quitar veto global de ${palabra}`}
                          >
                            <XIcon size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600 font-semibold">
                      Sin vetos globales.
                    </p>
                  )}
                </section>

                <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-white">Datos de la plantilla</h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        ESTILO_ESTADO[estado] || ESTILO_ESTADO.nuevo
                      }`}
                    >
                      {ETIQUETA_ESTADO[estado] || estado}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-[11px] font-bold text-slate-400">Nombre</span>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(event) => setNombre(event.target.value)}
                        disabled={bloqueado}
                        maxLength={120}
                        placeholder="Ej: Tablero de invierno"
                        className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-400 disabled:opacity-60"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold text-slate-400">Tema (título del desafío)</span>
                      <input
                        type="text"
                        value={tema}
                        onChange={(event) => setTema(event.target.value)}
                        disabled={bloqueado}
                        maxLength={120}
                        placeholder="Palabras Cruzadas"
                        className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-400 disabled:opacity-60"
                      />
                    </label>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400">Dificultad</span>
                      <div className="mt-1 flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-700">
                        {['facil', 'dificil'].map((valor) => (
                          <button
                            key={valor}
                            type="button"
                            onClick={() => setDificultad(valor)}
                            disabled={bloqueado}
                            className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              dificultad === valor
                                ? 'bg-amber-500 text-slate-950'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {valor === 'facil' ? 'Fácil' : 'Difícil'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agendar}
                          onChange={(event) => setAgendar(event.target.checked)}
                          disabled={bloqueado}
                          className="accent-amber-500"
                        />
                        <span className="text-[11px] font-bold text-slate-300">
                          Agendar al publicar
                        </span>
                      </label>
                      {agendar && (
                        <input
                          type="date"
                          value={fechaAgenda}
                          min={hoyISO()}
                          onChange={(event) => setFechaAgenda(event.target.value)}
                          disabled={bloqueado}
                          className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-amber-400 disabled:opacity-60"
                        />
                      )}
                      <label className="block mt-3">
                        <span className="text-[11px] font-bold text-slate-400">
                          Repetir todos los meses
                        </span>
                        <select
                          value={diaRecurrente}
                          onChange={(event) => setDiaRecurrente(event.target.value)}
                          disabled={bloqueado}
                          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-amber-400 disabled:opacity-60"
                        >
                          <option value="">No repetir</option>
                          {Array.from({ length: 31 }, (_, indice) => indice + 1).map((dia) => (
                            <option key={dia} value={dia}>
                              Día {dia} de cada mes
                            </option>
                          ))}
                        </select>
                      </label>
                      {diaRecurrente !== '' && (
                        <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
                          Cada mes se genera un tablero nuevo con esta máscara. Si el mes no
                          tiene ese día, se omite.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-white">Slots y anclas</h3>
                    <span className="text-[10px] font-bold text-slate-500">
                      {slots.length} palabras
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {slots.length === 0 && (
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Todavía no hay palabras: dibujá rachas de 3 a 10 letras.
                      </p>
                    )}
                    {slots.map((slot) => {
                      const numero = analisis.numeros[`${slot.row},${slot.col}`];
                      const ancla = anclas[slot.id];
                      const seleccionado = slotSel === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            setSlotSel(seleccionado ? null : slot.id);
                            setAnclaTexto(ancla || '');
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                            seleccionado
                              ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] text-slate-400">
                              {slot.dir}
                            </span>
                            <span className="text-slate-500">#{numero}</span>
                            <span>{slot.length} letras</span>
                            <span className="text-slate-500">{slot.crossings} cruces</span>
                          </span>
                          {ancla ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] shrink-0">
                              {ancla}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 shrink-0">{slot.id}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {slotActual && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <p className="text-[11px] font-bold text-slate-300 mb-2">
                        Ancla para {slotActual.id} · {slotActual.length} letras
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={anclaTexto}
                          onChange={(event) =>
                            setAnclaTexto(
                              event.target.value
                                .replace(/[^A-Za-zÑñÁÉÍÓÚÜáéíóúü]/g, '')
                                .toUpperCase()
                            )
                          }
                          maxLength={slotActual.length}
                          disabled={bloqueado || Boolean(anclas[slotActual.id])}
                          placeholder={'X'.repeat(slotActual.length)}
                          className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-[11px] font-black tracking-[0.2em] text-amber-200 focus:outline-none focus:border-amber-400 disabled:opacity-60"
                        />
                        {anclas[slotActual.id] ? (
                          <button
                            type="button"
                            onClick={() => {
                              quitarAncla(slotActual.id);
                              setAnclaTexto('');
                            }}
                            disabled={bloqueado}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Quitar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={agregarAncla}
                            disabled={
                              bloqueado ||
                              Object.keys(anclas).length >= MAX_ANCLAS ||
                              anclaTexto.trim().length !== slotActual.length
                            }
                            className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Fijar
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                        Máximo {MAX_ANCLAS} anclas, preferentemente en slots centrales. El servidor
                        valida que la palabra exista en el léxico del juego.
                      </p>
                    </div>
                  )}

                  {Object.keys(anclas).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(anclas).map(([id, palabra]) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300"
                        >
                          {id}: {palabra}
                          <button
                            type="button"
                            onClick={() => quitarAncla(id)}
                            disabled={bloqueado}
                            className="text-amber-400 hover:text-amber-200 cursor-pointer disabled:opacity-50"
                            aria-label={`Quitar ancla ${id}`}
                          >
                            <XIcon size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-white">Validación</h3>
                    {reporte && (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          reporte.solvable
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {reporte.solvable ? 'Soluble' : 'Sin solución'}
                      </span>
                    )}
                  </div>

                  <div className="mb-3 rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-400">Semilla</span>
                      <button
                        type="button"
                        onClick={() => setSemilla(generarSemilla())}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 transition cursor-pointer"
                        title="Generar una semilla aleatoria"
                      >
                        Generar
                      </button>
                    </div>
                    <input
                      type="text"
                      value={semilla}
                      onChange={(event) => setSemilla(event.target.value.replace(/\s+/g, ''))}
                      maxLength={64}
                      spellCheck={false}
                      className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-[11px] font-mono font-bold text-amber-200 focus:outline-none focus:border-amber-400"
                    />
                    <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                      Misma máscara y semilla = misma solución. Cambiala y volvé a resolver para variar.
                    </p>
                  </div>

                  <div className={`grid gap-2 ${solucion ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button
                      type="button"
                      onClick={() => validarMascara()}
                      disabled={validando || bloqueado}
                      className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 text-xs font-black tracking-wide shadow-lg shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      <SparklesIcon size={15} />
                      {validando ? 'Resolviendo…' : 'Validar y resolver'}
                    </button>
                    {solucion && (
                      <button
                        type="button"
                        onClick={() => validarMascara({ seed: generarSemilla() })}
                        disabled={validando || bloqueado}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                      >
                        <RefreshIcon size={14} />
                        Otra solución
                      </button>
                    )}
                  </div>

                  {reporte && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {reporte.words ?? slots.length} palabras
                        </span>
                        {typeof reporte.three_letter_words === 'number' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {reporte.three_letter_words} de 3 letras
                          </span>
                        )}
                        {reporte.attempts > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {reporte.attempts} intento(s)
                          </span>
                        )}
                        {typeof reporte.elapsed_ms === 'number' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {reporte.elapsed_ms} ms
                          </span>
                        )}
                        {reporte.seed && (
                          <span
                            className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono"
                            title="Semilla usada en esta solución"
                          >
                            {reporte.seed}
                          </span>
                        )}
                        {Array.isArray(reporte.banned_words) && reporte.banned_words.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300">
                            {reporte.banned_words.length} vetada(s)
                          </span>
                        )}
                      </div>
                      {Array.isArray(reporte.errors) && reporte.errors.length > 0 && (
                        <ul className="space-y-1">
                          {reporte.errors.map((mensaje, indice) => (
                            <li
                              key={`error-${indice}`}
                              className="text-[11px] font-semibold text-rose-300 leading-snug"
                            >
                              • {mensaje}
                            </li>
                          ))}
                        </ul>
                      )}
                      {Array.isArray(reporte.warnings) && reporte.warnings.length > 0 && (
                        <ul className="space-y-1">
                          {reporte.warnings.map((mensaje, indice) => (
                            <li
                              key={`aviso-${indice}`}
                              className="text-[11px] font-semibold text-amber-300 leading-snug"
                            >
                              • {mensaje}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </section>

                <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
                  {!bloqueado && (
                    <>
                      <button
                        type="button"
                        onClick={() => guardarPlantilla()}
                        disabled={guardando || publicando}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {guardando ? 'Guardando…' : plantillaId ? 'Guardar cambios' : 'Guardar borrador'}
                      </button>
                      <button
                        type="button"
                        onClick={publicarPlantilla}
                        disabled={publicando || guardando}
                        className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black tracking-wide shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publicando
                          ? 'Resolviendo y publicando…'
                          : agendar
                          ? `Publicar y agendar al ${fechaAgenda}`
                          : 'Publicar plantilla'}
                      </button>
                    </>
                  )}

                  {bloqueado && (
                    <>
                      <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                        <p className="text-[11px] font-bold text-slate-300 mb-2">
                          Aplicar a otra fecha
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={fechaAplicar}
                            min={hoyISO()}
                            onChange={(event) => setFechaAplicar(event.target.value)}
                            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={aplicarPublicada}
                            disabled={aplicando}
                            className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 text-[11px] font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {aplicando ? 'Aplicando…' : 'Aplicar'}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => archivarPlantilla(plantillaId)}
                        className="w-full px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-black transition cursor-pointer"
                      >
                        Archivar para editar
                      </button>
                    </>
                  )}

                  {plantillaId && (
                    <p className="text-[10px] text-slate-500 font-semibold text-center">
                      ID: {plantillaId}
                    </p>
                  )}
                </section>
              </aside>
            </div>
          ) : (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={filtroEstado}
                    onChange={(event) => setFiltroEstado(event.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Todos los estados</option>
                    <option value="draft">Borradores</option>
                    <option value="published">Publicadas</option>
                    <option value="archived">Archivadas</option>
                  </select>
                  <button
                    type="button"
                    onClick={cargarPlantillas}
                    disabled={cargandoPlanillas}
                    className="p-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                    title="Refrescar listado"
                  >
                    <RefreshIcon
                      size={16}
                      className={cargandoPlanillas ? 'animate-spin' : ''}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    reiniciarEditor();
                    setVista('editor');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <PlusIcon size={15} />
                  Nueva máscara
                </button>
              </div>

              {errorPlanillas && (
                <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangleIcon size={16} />
                  <span>{errorPlanillas}</span>
                </div>
              )}

              {cargandoPlanillas ? (
                <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                  Cargando plantillas…
                </div>
              ) : planillas.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                  No hay plantillas guardadas todavía.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {planillas.map((planilla) => (
                    <div
                      key={planilla.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-black text-white leading-tight">
                            {planilla.name}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              ESTILO_ESTADO[planilla.status] || ESTILO_ESTADO.nuevo
                            }`}
                          >
                            {ETIQUETA_ESTADO[planilla.status] || planilla.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-400 mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                            {planilla.size} × {planilla.size}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                            {planilla.difficulty === 'dificil' ? 'Difícil' : 'Fácil'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                            {planilla.total_words} palabras
                          </span>
                          {planilla.monthly_day && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Día {planilla.monthly_day} de cada mes
                            </span>
                          )}
                        </div>

                        {planilla.scheduled_date && (
                          <p className="text-[11px] font-semibold text-emerald-300 mb-1 inline-flex items-center gap-1.5">
                            <CalendarIcon size={12} />
                            Agendada: {planilla.scheduled_date}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Actualizada: {formatearFecha(planilla.updated_at)}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirPlantilla(planilla.id)}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition cursor-pointer"
                          >
                            Abrir
                          </button>
                          {planilla.status === 'published' && (
                            <button
                              type="button"
                              onClick={() =>
                                setAplicarId(aplicarId === planilla.id ? null : planilla.id)
                              }
                              className="flex-1 px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-[11px] font-bold transition cursor-pointer"
                            >
                              Aplicar
                            </button>
                          )}
                          {planilla.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => archivarPlantilla(planilla.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition cursor-pointer"
                              title="Archivar"
                            >
                              Archivar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => eliminarPlantilla(planilla.id)}
                            disabled={planilla.status === 'published'}
                            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              confirmDeleteId === planilla.id
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
                            }`}
                            title={
                              planilla.status === 'published'
                                ? 'Archivá la plantilla antes de eliminarla'
                                : 'Eliminar'
                            }
                          >
                            {confirmDeleteId === planilla.id ? '¿Seguro?' : <TrashIcon size={13} />}
                          </button>
                        </div>

                        {aplicarId === planilla.id && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={aplicarFecha}
                              min={hoyISO()}
                              onChange={(event) => setAplicarFecha(event.target.value)}
                              className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => aplicarPlantillaAFecha(planilla.id, aplicarFecha)}
                              disabled={aplicandoId === planilla.id}
                              className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 text-[11px] font-black transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {aplicandoId === planilla.id ? '…' : 'Aplicar'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-slate-500 font-semibold">
                Publicar fija la solución que aprobaste en el editor (si no validaste, resuelve con
                la semilla indicada). «Aplicar» sobrescribe un desafío existente en la fecha elegida
                sin cambiar el agendado de la plantilla.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
