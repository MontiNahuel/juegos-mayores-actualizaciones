/* Componente reutilizable para editar condiciones de aparición con estilo CogniJuegos. */
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, FilterIcon } from '../Icons';

export default function CondicionesAparicionEditor({
  condiciones = [],
  onChange,
  universoId = '',
  recursosDisponibles = ['oro', 'pueblo', 'ejercito', 'fe'],
}) {
  const [catalogoTags, setCatalogoTags] = useState([]);
  const [catalogoPersonajes, setCatalogoPersonajes] = useState([]);

  // Carga tags y personajes del universo para facilitar selección
  useEffect(() => {
    let cancelado = false;

    async function cargarCatalogos() {
      try {
        const urlTags = universoId
          ? `/api/narrative/admin/tags?universo_id=${encodeURIComponent(universoId)}`
          : '/api/narrative/admin/tags';
        const resTags = await fetch(urlTags);
        if (resTags.ok && !cancelado) {
          const dataTags = await resTags.json();
          setCatalogoTags(Array.isArray(dataTags) ? dataTags : []);
        }

        const urlPj = universoId
          ? `/api/narrative/admin/personajes?universo_id=${encodeURIComponent(universoId)}`
          : '/api/narrative/admin/personajes';
        const resPj = await fetch(urlPj);
        if (resPj.ok && !cancelado) {
          const dataPj = await resPj.json();
          setCatalogoPersonajes(Array.isArray(dataPj) ? dataPj : []);
        }
      } catch (err) {
        console.error('Error cargando catálogos en CondicionesAparicionEditor:', err);
      }
    }

    cargarCatalogos();
    return () => {
      cancelado = true;
    };
  }, [universoId]);

  const handleAgregar = () => {
    const nueva = {
      tipo: 'comparar_recurso',
      clave: recursosDisponibles[0] || 'oro',
      operador: '>=',
      valor: 50,
    };
    onChange([...condiciones, nueva]);
  };

  const handleEliminar = (index) => {
    const clon = [...condiciones];
    clon.splice(index, 1);
    onChange(clon);
  };

  const handleCambiar = (index, campo, valor) => {
    const clon = [...condiciones];
    const actual = { ...clon[index], [campo]: valor };

    // Si cambia de tipo, inicializar los campos correspondientes
    if (campo === 'tipo') {
      if (valor === 'comparar_recurso') {
        actual.clave = recursosDisponibles[0] || 'oro';
        actual.operador = '>=';
        actual.valor = 50;
        delete actual.personaje_id;
        delete actual.tag;
        delete actual.carta_id;
      } else if (valor === 'tiene_personaje') {
        actual.personaje_id = catalogoPersonajes[0]?._id || catalogoPersonajes[0]?.id || '';
        delete actual.clave;
        delete actual.operador;
        delete actual.valor;
        delete actual.tag;
        delete actual.carta_id;
      } else if (valor === 'afinidad_personaje') {
        actual.personaje_id = catalogoPersonajes[0]?._id || catalogoPersonajes[0]?.id || '';
        actual.operador = '>=';
        actual.valor = 60;
        delete actual.clave;
        delete actual.tag;
        delete actual.carta_id;
      } else if (valor === 'tiene_tag') {
        actual.tag = catalogoTags[0]?._id || catalogoTags[0]?.id || '';
        delete actual.clave;
        delete actual.operador;
        delete actual.valor;
        delete actual.personaje_id;
        delete actual.carta_id;
      } else if (valor === 'tiene_carta') {
        actual.carta_id = '';
        delete actual.clave;
        delete actual.operador;
        delete actual.valor;
        delete actual.personaje_id;
        delete actual.tag;
      }
    }

    clon[index] = actual;
    onChange(clon);
  };

  return (
    <div className="space-y-2.5 p-3.5 rounded-[16px] border border-[#52647b] bg-[#1b2737]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#f3f6fa] uppercase tracking-wider flex items-center gap-1.5">
          <FilterIcon size={14} className="text-[#99dcd1]" />
          Condiciones de Aparición ({condiciones.length})
        </label>
        <button
          type="button"
          onClick={handleAgregar}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[9px] bg-[#99dcd1]/20 hover:bg-[#99dcd1]/30 text-[#99dcd1] border border-[#99dcd1]/40 text-[11px] font-bold transition cursor-pointer"
        >
          <PlusIcon size={12} />
          <span>Agregar Condición</span>
        </button>
      </div>

      {condiciones.length === 0 ? (
        <p className="text-[11px] text-[#c0cbd7] italic p-2.5 rounded-[9px] border border-dashed border-[#52647b] bg-[#2a394c]/40 text-center">
          Sin condiciones de aparición: se sorteará libremente en cualquier mes o fase inicial.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {condiciones.map((cond, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center gap-2 p-2.5 rounded-[9px] bg-[#2a394c] border border-[#52647b] text-xs"
            >
              {/* Tipo de condición */}
              <div className="flex flex-col">
                <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Tipo</label>
                <select
                  value={cond.tipo || 'comparar_recurso'}
                  onChange={(e) => handleCambiar(idx, 'tipo', e.target.value)}
                  className="w-36 px-2 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] text-[11px] font-semibold text-[#99dcd1] [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa] focus:outline-none"
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
                    <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Recurso</label>
                    <select
                      value={cond.clave || recursosDisponibles[0] || 'oro'}
                      onChange={(e) => handleCambiar(idx, 'clave', e.target.value)}
                      className="w-24 px-1.5 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-bold text-[11px] text-[#f3f6fa] [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa]"
                    >
                      {recursosDisponibles.map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Operador</label>
                    <select
                      value={cond.operador || '>='}
                      onChange={(e) => handleCambiar(idx, 'operador', e.target.value)}
                      className="w-16 px-1.5 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-bold text-[11px] text-[#ecd098] text-center [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa]"
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
                    <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Valor</label>
                    <input
                      type="number"
                      value={cond.valor ?? 50}
                      onChange={(e) => handleCambiar(idx, 'valor', parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-bold text-[11px] text-center text-[#f3f6fa]"
                    />
                  </div>
                </>
              )}

              {cond.tipo === 'afinidad_personaje' && (
                <>
                  <div className="flex flex-col flex-1 min-w-[150px]">
                    <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Personaje</label>
                    <select
                      value={cond.personaje_id || ''}
                      onChange={(e) => handleCambiar(idx, 'personaje_id', e.target.value)}
                      className="px-2 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-bold text-[11px] text-[#ecd098] focus:outline-none [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa]"
                    >
                      <option value="">Seleccionar Personaje...</option>
                      {catalogoPersonajes.map((pj) => {
                        const pid = pj._id || pj.id;
                        return (
                          <option key={pid} value={pid}>
                            {pj.nombre} {pj.titulo ? `(${pj.titulo})` : ''}
                          </option>
                        );
                      })}
                      {cond.personaje_id && !catalogoPersonajes.some((p) => (p._id || p.id) === cond.personaje_id) && (
                        <option value={cond.personaje_id}>{cond.personaje_id} (actual)</option>
                      )}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Operador</label>
                    <select
                      value={cond.operador || '>='}
                      onChange={(e) => handleCambiar(idx, 'operador', e.target.value)}
                      className="w-16 px-1.5 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-bold text-[11px] text-[#ecd098] text-center [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa]"
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
                    <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Afinidad</label>
                    <input
                      type="number"
                      value={cond.valor ?? 60}
                      onChange={(e) => handleCambiar(idx, 'valor', parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-bold text-[11px] text-center text-[#f3f6fa]"
                    />
                  </div>
                </>
              )}

              {cond.tipo === 'tiene_personaje' && (
                <div className="flex flex-col flex-1 min-w-[160px]">
                  <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Personaje Requerido</label>
                  <select
                    value={cond.personaje_id || ''}
                    onChange={(e) => handleCambiar(idx, 'personaje_id', e.target.value)}
                    className="px-2 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-bold text-[11px] text-[#ecd098] focus:outline-none [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa]"
                  >
                    <option value="">Seleccionar Personaje...</option>
                    {catalogoPersonajes.map((pj) => {
                      const pid = pj._id || pj.id;
                      return (
                        <option key={pid} value={pid}>
                          {pj.nombre} {pj.titulo ? `(${pj.titulo})` : ''}
                        </option>
                      );
                    })}
                    {cond.personaje_id && !catalogoPersonajes.some((p) => (p._id || p.id) === cond.personaje_id) && (
                      <option value={cond.personaje_id}>{cond.personaje_id} (actual)</option>
                    )}
                  </select>
                </div>
              )}

              {cond.tipo === 'tiene_tag' && (
                <div className="flex flex-col flex-1 min-w-[160px]">
                  <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">Tag Pasivo Requerido</label>
                  {catalogoTags.length > 0 ? (
                    <select
                      value={cond.tag || ''}
                      onChange={(e) => handleCambiar(idx, 'tag', e.target.value)}
                      className="px-2 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-mono text-[11px] text-[#f3f6fa] focus:outline-none focus:border-[#ecd098] [color-scheme:dark] [&>option]:bg-[#1b2737] [&>option]:text-[#f3f6fa]"
                    >
                      <option value="">-- Seleccionar Tag --</option>
                      {catalogoTags.map((t) => (
                        <option key={t._id || t.id} value={t._id || t.id}>
                          #{t._id || t.id} {t.nombre ? `(${t.nombre})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={cond.tag || ''}
                      onChange={(e) => handleCambiar(idx, 'tag', e.target.value)}
                      placeholder="nobles_aliados"
                      className="px-2 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-mono text-[11px] text-[#f3f6fa]"
                    />
                  )}
                </div>
              )}

              {cond.tipo === 'tiene_carta' && (
                <div className="flex flex-col flex-1 min-w-[160px]">
                  <label className="text-[9px] uppercase font-bold text-[#c0cbd7] mb-0.5">ID Carta en Mano</label>
                  <input
                    type="text"
                    value={cond.carta_id || ''}
                    onChange={(e) => handleCambiar(idx, 'carta_id', e.target.value)}
                    placeholder="card_espada_real"
                    className="px-2 py-1 rounded-[6px] border border-[#52647b] bg-[#1b2737] font-mono text-[11px] text-[#f3f6fa]"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => handleEliminar(idx)}
                className="p-1.5 rounded-[6px] text-[#c0cbd7] hover:text-[#f0bb98] hover:bg-[#1b2737] ml-auto transition cursor-pointer"
                title="Quitar condición"
              >
                <TrashIcon size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
