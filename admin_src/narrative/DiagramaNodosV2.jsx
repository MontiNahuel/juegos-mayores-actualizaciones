import React, { useMemo } from 'react';
import {
  GitBranchIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  CheckIcon,
  UserIcon,
  SparklesIcon,
  EditIcon
} from '../Icons';

export default function DiagramaNodosV2({
  nodos = {},
  nodoRaiz = 'inicio',
  nodoSeleccionadoId = 'inicio',
  onSeleccionarNodo = () => {},
  personajes = []
}) {
  // 1. CÁLCULO TOPOLÓGICO Y POSICIONAMIENTO DE NODOS
  const { posiciones, lineas, canvasW, canvasH, estadisticas } = useMemo(() => {
    const nodosKeys = Object.keys(nodos);
    if (nodosKeys.length === 0) {
      return { posiciones: {}, lineas: [], canvasW: 600, canvasH: 400, estadisticas: {} };
    }

    // BFS para calcular la profundidad (columna) de cada nodo alcanzable desde nodoRaiz
    const niveles = {};
    const visitados = new Set();
    const cola = [{ id: nodoRaiz, depth: 0 }];
    niveles[nodoRaiz] = 0;
    visitados.add(nodoRaiz);

    while (cola.length > 0) {
      const { id, depth } = cola.shift();
      const nodo = nodos[id];
      if (nodo && !nodo.es_final && Array.isArray(nodo.opciones)) {
        for (const opt of nodo.opciones) {
          // Si la opción define desenlaces ponderados, reemplazan al destino fijo
          // (misma semántica que el motor de grafos).
          const desenlaces = Array.isArray(opt.desenlaces) ? opt.desenlaces : [];
          const destinos = desenlaces.length > 0
            ? desenlaces.map((d) => d.nodo)
            : [opt.siguiente_nodo];
          for (const dest of destinos) {
            // Cada nodo se visita una única vez (profundidad mínima), lo que
            // evita bucles infinitos cuando el grafo contiene ciclos.
            if (dest && nodos[dest] && !visitados.has(dest)) {
              niveles[dest] = depth + 1;
              visitados.add(dest);
              cola.push({ id: dest, depth: depth + 1 });
            }
          }
        }
      }
    }

    // Nodos no alcanzables (huérfanos)
    let maxNivel = 0;
    for (const d of Object.values(niveles)) {
      if (d > maxNivel) maxNivel = d;
    }

    const huerfanos = [];
    for (const nid of nodosKeys) {
      if (niveles[nid] === undefined) {
        huerfanos.push(nid);
        niveles[nid] = maxNivel + 1; // Columna dedicada al final para huérfanos
      }
    }

    // Agrupar nodos por columna
    const columnas = {};
    for (const [nid, depth] of Object.entries(niveles)) {
      if (!columnas[depth]) columnas[depth] = [];
      columnas[depth].push(nid);
    }

    // Parámetros de cuadrícula
    const CARD_W = 240;
    const CARD_H = 120;
    const COL_GAP = 110;
    const ROW_GAP = 36;
    const PAD_X = 50;
    const PAD_Y = 50;

    const posMap = {};
    let maxRows = 0;
    let maxColIdx = 0;

    for (const [colStr, ids] of Object.entries(columnas)) {
      const col = parseInt(colStr, 10);
      if (col > maxColIdx) maxColIdx = col;
      if (ids.length > maxRows) maxRows = ids.length;

      ids.forEach((nid, rowIdx) => {
        posMap[nid] = {
          x: PAD_X + col * (CARD_W + COL_GAP),
          y: PAD_Y + rowIdx * (CARD_H + ROW_GAP),
          w: CARD_W,
          h: CARD_H,
          depth: col,
          esHuerfano: huerfanos.includes(nid)
        };
      });
    }

    const cW = Math.max(900, PAD_X * 2 + (maxColIdx + 1) * CARD_W + maxColIdx * COL_GAP);
    const cH = Math.max(520, PAD_Y * 2 + maxRows * (CARD_H + ROW_GAP) + 60);

    // 2. CONECTORES Y LÍNEAS SVG ENTRE NODOS
    const linesArr = [];
    let ramasRotas = 0;
    let totalOpciones = 0;

    for (const [nid, nodo] of Object.entries(nodos)) {
      const posPadre = posMap[nid];
      if (!posPadre || nodo.es_final || !Array.isArray(nodo.opciones)) continue;

      // Aplanar los destinos efectivos de cada opción. Si hay desenlaces
      // ponderados, reemplazan al destino fijo (misma semántica que el motor).
      const destinos = [];
      nodo.opciones.forEach((opt) => {
        totalOpciones++;
        const desenlaces = Array.isArray(opt.desenlaces) ? opt.desenlaces : [];
        if (desenlaces.length > 0) {
          const sumaPesos = desenlaces.reduce((acc, d) => acc + (parseFloat(d.peso) || 0), 0) || 1;
          for (const d of desenlaces) {
            const peso = parseFloat(d.peso) || 0;
            destinos.push({
              opt,
              dest: d.nodo,
              esDesenlace: true,
              porcentaje: Math.round((peso / sumaPesos) * 100)
            });
          }
        } else {
          destinos.push({ opt, dest: opt.siguiente_nodo, esDesenlace: false, porcentaje: null });
        }
      });

      const totalEdges = destinos.length;

      destinos.forEach(({ opt, dest, esDesenlace, porcentaje }, edgeIdx) => {
        const posHijo = posMap[dest];
        const esRoto = !posHijo;
        if (esRoto) ramasRotas++;

        // Origen: borde derecho del nodo padre, repartido verticalmente
        const x1 = posPadre.x + posPadre.w;
        const y1 = posPadre.y + 35 + (edgeIdx + 1) * ((posPadre.h - 40) / (totalEdges + 1));

        // Destino: borde izquierdo del nodo hijo, centrado verticalmente
        const x2 = posHijo ? posHijo.x : x1 + 60;
        const y2 = posHijo ? posHijo.y + posHijo.h / 2 : y1;

        // Curva Bezier cúbica
        const dx = Math.max(45, (x2 - x1) * 0.5);
        const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        // Punto medio para etiqueta de texto
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        const esActivo = nid === nodoSeleccionadoId || dest === nodoSeleccionadoId;
        const tieneCondiciones = Array.isArray(opt.condiciones) && opt.condiciones.length > 0;

        const texto = opt.texto || opt.id;
        const etiqueta =
          (tieneCondiciones ? '🔒 ' : '') +
          (esDesenlace ? `🎲 ${porcentaje}% · ` : '') +
          texto;

        linesArr.push({
          id: `line_${nid}_${opt.id}_${dest}_${edgeIdx}`,
          path: pathData,
          esRoto,
          origen: nid,
          dest,
          etiqueta,
          tieneCondiciones,
          bloqueoModo: opt.bloqueo_modo || 'deshabilitada',
          numCondiciones: tieneCondiciones ? opt.condiciones.length : 0,
          midX,
          midY,
          esActivo,
          esDesenlace
        });
      });
    }

    return {
      posiciones: posMap,
      lineas: linesArr,
      canvasW: cW,
      canvasH: cH,
      estadisticas: {
        totalNodos: nodosKeys.length,
        totalOpciones,
        huerfanosCount: huerfanos.length,
        ramasRotas
      }
    };
  }, [nodos, nodoRaiz, nodoSeleccionadoId]);

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
      {/* BARRA DE HERRAMIENTAS Y LEYENDA DEL DIAGRAMA */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-[#002B5E] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <GitBranchIcon size={14} />
            <span>Mapa Visual del Grafo</span>
          </span>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Nodo Raíz</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#002B5E]" />
              <span>Dilema con Opciones</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Desenlace Final</span>
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <span>🔒</span>
              <span>Rama Condicional</span>
            </span>
            {estadisticas.huerfanosCount > 0 && (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                ⚠️ {estadisticas.huerfanosCount} huérfano(s)
              </span>
            )}
            {estadisticas.ramasRotas > 0 && (
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-bold">
                ⛔ {estadisticas.ramasRotas} salto(s) roto(s)
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          💡 Hacé clic en cualquier nodo para seleccionarlo y editarlo.
        </div>
      </div>

      {/* LIENZO SCROLLABLE CON SVG Y TARJETAS ABSOLUTAS */}
      <div className="flex-1 overflow-auto p-4 relative bg-slate-50/70 select-none">
        <div
          className="relative min-w-full"
          style={{ width: `${canvasW}px`, height: `${canvasH}px` }}
        >
          {/* CAPA SVG: LÍNEAS DE CONEXIÓN Y FLECHAS */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={canvasW}
            height={canvasH}
            style={{ zIndex: 1 }}
          >
            <defs>
              {/* Marcador Flecha Normal */}
              <marker
                id="flecha-normal"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
              </marker>

              {/* Marcador Flecha Activa (Seleccionada) */}
              <marker
                id="flecha-activa"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#002B5E" />
              </marker>

              {/* Marcador Flecha Rota (Destino inexistente) */}
              <marker
                id="flecha-roto"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Renderizar todas las líneas */}
            {lineas.map((linea) => {
              const strokeColor = linea.esRoto
                ? '#ef4444'
                : linea.esActivo
                ? '#002B5E'
                : '#cbd5e1';

              const markerEnd = linea.esRoto
                ? 'url(#flecha-roto)'
                : linea.esActivo
                ? 'url(#flecha-activa)'
                : 'url(#flecha-normal)';

              const rectW = Math.max(64, Math.min(180, (linea.etiqueta || '').length * 6 + 22));

              return (
                <g key={linea.id}>
                  {/* Línea principal */}
                  <path
                    d={linea.path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={linea.esActivo ? 2.5 : 1.8}
                    strokeDasharray={linea.esRoto ? '4 4' : 'none'}
                    markerEnd={markerEnd}
                    className="transition-all duration-150"
                  />

                  {/* Etiqueta flotante con el texto de la opción sobre la curva */}
                  {linea.etiqueta && (
                    <g transform={`translate(${linea.midX}, ${linea.midY})`}>
                      <rect
                        x={-rectW / 2}
                        y="-10"
                        width={rectW}
                        height="20"
                        rx="10"
                        fill={linea.tieneCondiciones ? "#fffbeb" : "#ffffff"}
                        stroke={linea.tieneCondiciones ? "#d97706" : strokeColor}
                        strokeWidth={linea.tieneCondiciones ? 1.5 : 1}
                        className="shadow-xs"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill={linea.esRoto ? '#ef4444' : linea.tieneCondiciones ? '#b45309' : '#475569'}
                      >
                        {linea.etiqueta.length > 26
                          ? `${linea.etiqueta.slice(0, 25)}…`
                          : linea.etiqueta}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* CAPA HTML: TARJETAS DE LOS NODOS */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            {Object.entries(nodos).map(([nid, n]) => {
              const pos = posiciones[nid];
              if (!pos) return null;

              const esRaiz = nid === nodoRaiz;
              const esActivo = nid === nodoSeleccionadoId;
              const esFinal = !!n.es_final;
              const esHuerfano = !!pos.esHuerfano;

              // Identificar orador
              const pjInfo = personajes.find((p) => (p._id || p.id) === n.hablante_id);
              const nombreOrador = pjInfo?.nombre || (n.hablante_id === 'narrador' ? 'Crónicas del Reino' : n.hablante_id);

              return (
                <div
                  key={nid}
                  onClick={() => onSeleccionarNodo(nid)}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    width: `${pos.w}px`,
                    height: `${pos.h}px`
                  }}
                  className={`rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between bg-white ${
                    esActivo
                      ? 'border-[#002B5E] shadow-lg ring-4 ring-[#002B5E]/15 scale-[1.02]'
                      : esFinal
                      ? 'border-emerald-300 hover:border-emerald-500 shadow-xs'
                      : esRaiz
                      ? 'border-amber-300 hover:border-amber-500 shadow-xs'
                      : 'border-slate-200 hover:border-slate-400 shadow-xs'
                  }`}
                >
                  {/* Cabecera del Nodo */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="font-mono text-xs font-black text-slate-900 truncate">
                          {nid}
                        </span>
                        {esRaiz && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            RAÍZ
                          </span>
                        )}
                        {esFinal && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            FINAL
                          </span>
                        )}
                        {esHuerfano && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300" title="Este nodo no se alcanza desde la raíz">
                            AISLADO
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {esFinal ? '🏁' : `${n.opciones?.length || 0} opt`}
                      </span>
                    </div>

                    {/* Orador */}
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#002B5E] mb-1 truncate">
                      <UserIcon size={11} className="flex-shrink-0" />
                      <span className="truncate">{nombreOrador}</span>
                    </div>

                    {/* Texto Narrativo Truncado */}
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug font-serif">
                      {n.texto || 'Sin texto redactado'}
                    </p>
                  </div>

                  {/* Pie de la Tarjeta */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    {esFinal ? (
                      <div className="flex items-center gap-1 text-emerald-700 font-bold truncate">
                        <span>Recompensas:</span>
                        <span className="font-mono text-[9px] bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                          {n.impactos_recursos?.length || 0} rec / {n.impactos_afinidad?.length || 0} afin
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-500 font-mono text-[9px] truncate">
                        <span>Ramas:</span>
                        {(n.opciones || []).slice(0, 2).map((opt, i) => (
                          <span key={i} className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                            → {opt.siguiente_nodo}
                          </span>
                        ))}
                        {(n.opciones || []).length > 2 && (
                          <span>+{n.opciones.length - 2}</span>
                        )}
                      </div>
                    )}

                    <span className="text-[#002B5E] font-bold text-[10px] flex items-center hover:underline">
                      Editar →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
