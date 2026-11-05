/* Editor de condiciones de aparición para Cartas y Personajes */
import React from 'react';
import { FilterIcon, PlusIcon, TrashIcon } from '../Icons';

export default function CondicionesAparicionEditor({
  condiciones = [],
  onChange,
  recursosDisponibles = ['oro', 'pueblo', 'ejercito', 'fe'],
}) {
  const handleAgregar = () => {
    const nueva = {
      tipo: 'comparar_recurso',
      clave: recursosDisponibles[0] || 'oro',
      operador: '>=',
      valor: 50,
      personaje_id: null,
      carta_id: null,
      tag: null,
    };
    onChange([...condiciones, nueva]);
  };

  const handleEliminar = (idx) => {
    onChange(condiciones.filter((_, i) => i !== idx));
  };

  const handleCambiar = (idx, campo, valor) => {
    const copia = [...condiciones];
    copia[idx] = { ...copia[idx], [campo]: valor };

    // Si cambia el tipo, normalizar campos relevantes
    if (campo === 'tipo') {
      if (valor === 'comparar_recurso') {
        copia[idx].clave = recursosDisponibles[0] || 'oro';
        copia[idx].operador = '>=';
        copia[idx].valor = 50;
      } else if (valor === 'afinidad_personaje') {
        copia[idx].personaje_id = '';
        copia[idx].operador = '>=';
        copia[idx].valor = 60;
      } else if (valor === 'tiene_personaje') {
        copia[idx].personaje_id = '';
      } else if (valor === 'tiene_tag') {
        copia[idx].tag = '';
      } else if (valor === 'tiene_carta') {
        copia[idx].carta_id = '';
      }
    }

    onChange(copia);
  };

  return (
    <div className="space-y-2.5 p-3 rounded-xl border border-white/10 bg-slate-950/40">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <FilterIcon size={14} className="text-emerald-400" />
          Condiciones de Aparición ({condiciones.length})
        </label>
        <button
          type="button"
          onClick={handleAgregar}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition cursor-pointer"
        >
          <PlusIcon size={12} />
          <span>Agregar Condición</span>
        </button>
      </div>

      {condiciones.length === 0 ? (
        <p className="text-[11px] text-slate-500 italic p-2.5 rounded-lg border border-dashed border-white/5 bg-slate-900/30 text-center">
          Sin condiciones de aparición: se sorteará libremente en cualquier mes o fase inicial.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {condiciones.map((cond, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-white/5 text-xs"
            >
              {/* Tipo de condición */}
              <div className="flex flex-col">
                <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Tipo</label>
                <select
                  value={cond.tipo || 'comparar_recurso'}
                  onChange={(e) => handleCambiar(idx, 'tipo', e.target.value)}
                  className="w-36 px-2 py-1 rounded-md border border-white/10 bg-slate-950 text-[11px] font-semibold text-emerald-300 focus:outline-none"
                >
                  <option value="comparar_recurso">Comparar Recurso</option>
                  <option value="tiene_personaje">Tiene Personaje</option>
                  <option value="afinidad_personaje">Afinidad Personaje</option>
                  <option value="tiene_tag">Tiene Tag Pasivo</option>
                  <option value="tiene_carta">Tiene Carta en Mano</option>
                </select>
              </div>

              {/* Parámetros según tipo */}
              {cond.tipo === 'comparar_recurso' && (
                <>
                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Recurso</label>
                    <select
                      value={cond.clave || recursosDisponibles[0] || 'oro'}
                      onChange={(e) => handleCambiar(idx, 'clave', e.target.value)}
                      className="w-24 px-1.5 py-1 rounded-md border border-white/10 bg-slate-950 font-bold text-[11px] text-slate-200"
                    >
                      {recursosDisponibles.map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Operador</label>
                    <select
                      value={cond.operador || '>='}
                      onChange={(e) => handleCambiar(idx, 'operador', e.target.value)}
                      className="w-16 px-1.5 py-1 rounded-md border border-white/10 bg-slate-950 font-bold text-[11px] text-amber-300 text-center"
                    >
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="==">==</option>
                      <option value="!=">!=</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Valor</label>
                    <input
                      type="number"
                      value={cond.valor ?? 50}
                      onChange={(e) => handleCambiar(idx, 'valor', parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-1 rounded-md border border-white/10 bg-slate-950 font-bold text-[11px] text-center text-slate-200"
                    />
                  </div>
                </>
              )}

              {cond.tipo === 'afinidad_personaje' && (
                <>
                  <div className="flex flex-col flex-1 min-w-[130px]">
                    <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">ID Personaje</label>
                    <input
                      type="text"
                      value={cond.personaje_id || ''}
                      onChange={(e) => handleCambiar(idx, 'personaje_id', e.target.value)}
                      placeholder="pj_canciller_elena"
                      className="px-2 py-1 rounded-md border border-white/10 bg-slate-950 font-mono text-[11px] text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Operador</label>
                    <select
                      value={cond.operador || '>='}
                      onChange={(e) => handleCambiar(idx, 'operador', e.target.value)}
                      className="w-16 px-1.5 py-1 rounded-md border border-white/10 bg-slate-950 font-bold text-[11px] text-amber-300 text-center"
                    >
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="==">==</option>
                      <option value="!=">!=</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Afinidad</label>
                    <input
                      type="number"
                      value={cond.valor ?? 60}
                      onChange={(e) => handleCambiar(idx, 'valor', parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-1 rounded-md border border-white/10 bg-slate-950 font-bold text-[11px] text-center text-slate-200"
                    />
                  </div>
                </>
              )}

              {cond.tipo === 'tiene_personaje' && (
                <div className="flex flex-col flex-1 min-w-[160px]">
                  <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">ID Personaje Requerido</label>
                  <input
                    type="text"
                    value={cond.personaje_id || ''}
                    onChange={(e) => handleCambiar(idx, 'personaje_id', e.target.value)}
                    placeholder="pj_canciller_elena"
                    className="px-2 py-1 rounded-md border border-white/10 bg-slate-950 font-mono text-[11px] text-slate-200"
                  />
                </div>
              )}

              {cond.tipo === 'tiene_tag' && (
                <div className="flex flex-col flex-1 min-w-[160px]">
                  <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Tag Pasivo Requerido</label>
                  <input
                    type="text"
                    value={cond.tag || ''}
                    onChange={(e) => handleCambiar(idx, 'tag', e.target.value)}
                    placeholder="nobles_aliados"
                    className="px-2 py-1 rounded-md border border-white/10 bg-slate-950 font-mono text-[11px] text-slate-200"
                  />
                </div>
              )}

              {cond.tipo === 'tiene_carta' && (
                <div className="flex flex-col flex-1 min-w-[160px]">
                  <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">ID Carta en Mano</label>
                  <input
                    type="text"
                    value={cond.carta_id || ''}
                    onChange={(e) => handleCambiar(idx, 'carta_id', e.target.value)}
                    placeholder="card_espada_real"
                    className="px-2 py-1 rounded-md border border-white/10 bg-slate-950 font-mono text-[11px] text-slate-200"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => handleEliminar(idx)}
                className="p-1 rounded text-slate-500 hover:text-rose-400 ml-auto"
                title="Quitar condición"
              >
                <TrashIcon size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
