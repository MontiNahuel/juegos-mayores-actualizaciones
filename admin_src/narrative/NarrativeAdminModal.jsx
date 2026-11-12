/* Organiza las pestañas para administrar el contenido narrativo con estilo CogniJuegos. */
import { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  CrownIcon,
  UsersIcon,
  LayersIcon,
  SparklesIcon,
  CalendarIcon,
  SkullIcon,
  XIcon,
  GitBranchIcon,
  TagIcon,
} from '../Icons';
import UniversosTab from './UniversosTab';
import PersonajesTab from './PersonajesTab';
import CartasTab from './CartasTab';
import TagsTab from './TagsTab';
import FinalizacionesTab from './FinalizacionesTab';
import CalendarioTab from './CalendarioTab';
import GrafosV2Tab from './GrafosV2Tab';
import AccionesTab from './AccionesTab';
import FrecuenciasTab from './FrecuenciasTab';

// Organiza las pestañas para administrar el contenido narrativo.
export default function NarrativeAdminModal({ abierto, onCerrar, embebido = false }) {
  const [tabActiva, setTabActiva] = useState('universos');
  const [universos, setUniversos] = useState([]);
  const [personajes, setPersonajes] = useState([]);

  // Cargar lista de universos
  const cargarUniversos = async () => {
    try {
      const res = await fetch('/api/narrative/admin/universos');
      if (res.ok) {
        const data = await res.json();
        setUniversos(data);
      }
    } catch (e) {
      console.error('Error al cargar universos en modal:', e);
    }
  };

  // Cargar lista de personajes para referencias cruzadas
  const cargarPersonajes = async () => {
    try {
      const res = await fetch('/api/narrative/admin/personajes');
      if (res.ok) {
        const data = await res.json();
        setPersonajes(data);
      }
    } catch (e) {
      console.error('Error al cargar personajes en modal:', e);
    }
  };

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (abierto) {
      cargarUniversos();
      cargarPersonajes();
    }
  }, [abierto]);

  if (!abierto) return null;

  const grupos = [
    {
      titulo: 'Contenido',
      tabs: [
        { id: 'universos', label: 'Universos', Icon: CrownIcon, count: universos.length },
        { id: 'personajes', label: 'Personajes', Icon: UsersIcon, count: personajes.length },
        { id: 'cartas', label: 'Cartas', Icon: LayersIcon },
        { id: 'tags', label: 'Tags', Icon: TagIcon },
        { id: 'acciones', label: 'Acciones', Icon: SparklesIcon },
        { id: 'frecuencias', label: 'Frecuencias', Icon: CalendarIcon },
      ],
    },
    {
      titulo: 'Producción',
      tabs: [
        { id: 'finalizaciones', label: 'Finalizaciones', Icon: SkullIcon },
        { id: 'calendario', label: 'Calendario', Icon: CalendarIcon },
        { id: 'grafos_v2', label: 'Grafos V2', Icon: GitBranchIcon },
      ],
    },
  ];

  const claseItem =
    'flex w-full items-center gap-2.5 rounded-[9px] border-l-2 px-3 py-2 text-left text-[13px] font-semibold transition';

  const navegacion = (
    <div className="space-y-6">
      {grupos.map(({ titulo, tabs }) => (
        <div key={titulo}>
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c0cbd7]">
            {titulo}
          </p>
          <div className="space-y-0.5">
            {tabs.map(({ id, label, Icon, count }) => {
              const estaActiva = tabActiva === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTabActiva(id)}
                  aria-current={estaActiva ? 'page' : undefined}
                  className={`${claseItem} ${
                    estaActiva
                      ? 'border-[#ecd098] bg-[#2e3c50] text-[#ecd098]'
                      : 'border-transparent text-[#c0cbd7] hover:bg-[#2a394c] hover:text-[#f3f6fa]'
                  }`}
                >
                  <Icon
                    size={15}
                    className={estaActiva ? 'text-[#ecd098]' : 'text-[#c0cbd7]'}
                  />
                  <span className="truncate">{label}</span>
                  {typeof count === 'number' && (
                    <span
                      className={`ml-auto rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold ${
                        estaActiva
                          ? 'bg-[#1b2737] text-[#ecd098] border border-[#52647b]'
                          : 'bg-[#1b2737] text-[#c0cbd7]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="hidden rounded-[16px] border border-[#52647b] bg-[#1b2737] p-3.5 lg:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c0cbd7]">
          Universo activo
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-[#f3f6fa]">
          <CrownIcon size={14} className="text-[#ecd098]" />
          <span className="truncate">{universos[0]?.nombre || 'Corte Medieval'}</span>
        </div>
      </div>
    </div>
  );

  const contenido =
    tabActiva === 'grafos_v2' ? (
      <GrafosV2Tab universos={universos} personajes={personajes} />
    ) : (
      <div>
        {tabActiva === 'universos' && <UniversosTab onUniversosChange={setUniversos} />}
        {tabActiva === 'personajes' && <PersonajesTab universos={universos} />}
        {tabActiva === 'cartas' && <CartasTab universos={universos} />}
        {tabActiva === 'tags' && <TagsTab universos={universos} />}
        {tabActiva === 'acciones' && <AccionesTab universos={universos} />}
        {tabActiva === 'frecuencias' && <FrecuenciasTab universos={universos} />}
        {tabActiva === 'finalizaciones' && <FinalizacionesTab universos={universos} />}
        {tabActiva === 'calendario' && <CalendarioTab universos={universos} />}
      </div>
    );

  const workspace = (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      <div>
        <label className="block lg:hidden">
          <span className="sr-only">Sección del motor narrativo</span>
          <select
            value={tabActiva}
            onChange={(e) => setTabActiva(e.target.value)}
            className="w-full rounded-[9px] border border-[#52647b] bg-[#1b2737] px-3 py-2.5 text-sm font-semibold text-[#f3f6fa] [color-scheme:dark] [&>optgroup]:bg-[#1b2737] [&>optgroup]:text-[#c0cbd7] [&>optgroup>option]:bg-[#1b2737] [&>optgroup>option]:text-[#f3f6fa] focus:border-[#ecd098] focus:outline-none focus:ring-1 focus:ring-[#ecd098]"
          >
            {grupos.map(({ titulo, tabs }) => (
              <optgroup key={titulo} label={titulo}>
                {tabs.map(({ id, label, count }) => (
                  <option key={id} value={id}>
                    {label}
                    {typeof count === 'number' ? ` (${count})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <nav className="hidden lg:sticky lg:top-24 lg:block lg:self-start">{navegacion}</nav>
      </div>

      <div className="min-w-0">{contenido}</div>
    </div>
  );

  if (embebido) return <section className="w-full">{workspace}</section>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#151e2b]/85 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex h-full max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-[16px] border border-[#52647b] bg-[#1b2737] shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-[#364454] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#ecd098] text-[#172433]">
              <BookOpenIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight text-[#f3f6fa]">
                Motor Narrativo V2
              </h2>
              <p className="text-[11px] font-medium text-[#c0cbd7]">
                Universos, personajes, cartas, eventos y grafos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-[9px] p-2 text-[#c0cbd7] transition hover:bg-[#2a394c] hover:text-[#f3f6fa]"
            title="Cerrar panel"
          >
            <XIcon size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{workspace}</div>
      </div>
    </div>
  );
}
