import { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  CrownIcon,
  UsersIcon,
  LayersIcon,
  SparklesIcon,
  FileTextIcon,
  MessageSquareIcon,
  CalendarIcon,
  SkullIcon,
  XIcon,
} from '../Icons';
import UniversosTab from './UniversosTab';
import PersonajesTab from './PersonajesTab';
import CartasTab from './CartasTab';
import ResultadosTab from './ResultadosTab';
import EventosTab from './EventosTab';
import ConversacionesTab from './ConversacionesTab';
import FinalizacionesTab from './FinalizacionesTab';
import CalendarioTab from './CalendarioTab';

export default function NarrativeAdminModal({ abierto, onCerrar }) {
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

  useEffect(() => {
    if (abierto) {
      cargarUniversos();
      cargarPersonajes();
    }
  }, [abierto]);

  if (!abierto) return null;

  const tabsConfig = [
    { id: 'universos', label: '1. Universos', Icon: CrownIcon, count: universos.length },
    { id: 'personajes', label: '2. Personajes', Icon: UsersIcon, count: personajes.length },
    { id: 'cartas', label: '3. Cartas', Icon: LayersIcon },
    { id: 'resultados', label: '4. Desenlaces', Icon: SparklesIcon },
    { id: 'eventos', label: '5. Eventos', Icon: FileTextIcon },
    { id: 'conversaciones', label: '6. Diálogos', Icon: MessageSquareIcon },
    { id: 'finalizaciones', label: '7. Finalizaciones', Icon: SkullIcon },
    { id: 'calendario', label: '8. Calendario', Icon: CalendarIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-slate-50 rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-7xl h-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera Principal */}
        <header className="bg-white px-6 py-4 border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#002B5E] text-white flex items-center justify-center shadow-xs">
              <BookOpenIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  Torre de Control · Crónicas de la Corte Real
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-full">
                  Juego Narrativo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Suite completa de administración: arquetipos, cartas, eventos, diálogos y generación de desafíos diarios
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Cerrar panel"
          >
            <XIcon size={20} />
          </button>
        </header>

        {/* Barra de Pestañas de Navegación (7 Pestañas ABM) */}
        <div className="bg-white px-6 border-b border-slate-200/80 flex items-center justify-between gap-4 overflow-x-auto flex-shrink-0">
          <div className="flex items-center gap-1.5 py-2.5">
            {tabsConfig.map((tab) => {
              const { id, label, Icon, count } = tab;
              const estaActiva = tabActiva === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTabActiva(id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    estaActiva
                      ? 'bg-[#002B5E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                  {typeof count === 'number' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        estaActiva
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-semibold text-slate-400 hidden xl:inline-block whitespace-nowrap">
            Universo Activo:{' '}
            <strong className="text-slate-700">{universos[0]?.nombre || 'Corte Medieval'}</strong>
          </span>
        </div>

        {/* Contenedor de la Pestaña Activa */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {tabActiva === 'universos' && (
            <UniversosTab onUniversosChange={setUniversos} />
          )}

          {tabActiva === 'personajes' && (
            <PersonajesTab universos={universos} />
          )}

          {tabActiva === 'cartas' && (
            <CartasTab universos={universos} />
          )}

          {tabActiva === 'resultados' && (
            <ResultadosTab universos={universos} personajes={personajes} />
          )}

          {tabActiva === 'eventos' && (
            <EventosTab universos={universos} personajes={personajes} />
          )}

          {tabActiva === 'conversaciones' && (
            <ConversacionesTab universos={universos} personajes={personajes} />
          )}

          {tabActiva === 'finalizaciones' && (
            <FinalizacionesTab universos={universos} />
          )}

          {tabActiva === 'calendario' && (
            <CalendarioTab universos={universos} />
          )}
        </div>

        {/* Pie de Panel */}
        <footer className="bg-white px-6 py-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span className="text-[11px]">
            Sincronización en tiempo real con MongoDB y el motor roguelite de partidas.
          </span>
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Cerrar Panel
          </button>
        </footer>
      </div>
    </div>
  );
}
