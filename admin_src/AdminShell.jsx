/* Marco visual del panel: navegación lateral, cabecera y acciones comunes. */
import { useState } from 'react';
import {
  BookOpenIcon,
  CalendarIcon,
  ChevronRightIcon,
  CoinsIcon,
  CrownIcon,
  LogOutIcon,
  MenuIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from './Icons';
import { irAlMenuDeJuegos } from './authService';

const VISTAS = [
  { id: 'resumen', label: 'Resumen', icon: SparklesIcon },
  { id: 'jugadores', label: 'Jugadores', icon: UserIcon },
];

const HERRAMIENTAS = [
  { id: 'narrativo', label: 'Narrativo V2', icon: CrownIcon },
  { id: 'desafios', label: 'Desafíos', icon: CalendarIcon },
  { id: 'economia', label: 'Economía', icon: CoinsIcon },
];

const TITULOS = {
  resumen: { titulo: 'Resumen', detalle: 'Accesos y estado del panel de juegos' },
  jugadores: { titulo: 'Jugadores', detalle: 'Ficha lúdica y soporte directo' },
  narrativo: {
    titulo: 'Motor Narrativo V2',
    detalle: 'Universos, personajes, cartas, eventos y grafos',
  },
  desafios: {
    titulo: 'Desafíos del calendario',
    detalle: 'Cobertura mensual de los cuatro juegos diarios',
  },
  economia: {
    titulo: 'Economía y vidas',
    detalle: 'Parámetros globales de vidas, puntos y recompensas',
  },
};

function iniciales(nombre = '') {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  const texto = partes.slice(0, 2).map((parte) => parte[0]).join('');
  return texto.toUpperCase() || 'OP';
}

export default function AdminShell({
  active,
  onNavigate,
  onOpenTool,
  operador,
  onSSO,
  saltandoSSO,
  onLogout,
  children,
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const titulo = TITULOS[active] || TITULOS.resumen;
  const esHerramienta = HERRAMIENTAS.some(({ id }) => id === active);
  const ancho = esHerramienta ? 'max-w-[1400px]' : 'max-w-6xl';

  const navegar = (vista) => {
    setMenuAbierto(false);
    onNavigate(vista);
  };

  const abrirHerramienta = (id) => {
    setMenuAbierto(false);
    onOpenTool(id);
  };

  const claseItem =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition';

  const navegacion = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
          <CrownIcon size={20} />
        </div>
        <div>
          <p className="text-sm font-black tracking-tight text-white">CogniJuegos</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400/80">
            Torre de Control
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Panel
          </p>
          {VISTAS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => navegar(id)}
              aria-current={active === id ? 'page' : undefined}
              className={`${claseItem} ${
                active === id
                  ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Herramientas
          </p>
          {HERRAMIENTAS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => abrirHerramienta(id)}
              aria-current={active === id ? 'page' : undefined}
              className={`${claseItem} ${
                active === id
                  ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="space-y-1 border-t border-white/5 px-3 py-4">
        <button
          type="button"
          onClick={irAlMenuDeJuegos}
          className={`${claseItem} text-slate-400 hover:bg-white/5 hover:text-slate-100`}
        >
          <BookOpenIcon size={17} />
          Ir a Juegos
        </button>
        <button
          type="button"
          onClick={onSSO}
          disabled={saltandoSSO}
          className={`${claseItem} text-slate-400 hover:bg-white/5 hover:text-slate-100 disabled:opacity-50`}
        >
          <ShieldIcon size={17} />
          {saltandoSSO ? 'Conectando...' : 'Usuarios Central'}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className={`${claseItem} text-slate-500 hover:bg-rose-500/10 hover:text-rose-300`}
        >
          <LogOutIcon size={17} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-amber-500/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/5 bg-slate-950 lg:block">
        {navegacion}
      </aside>

      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/5 bg-slate-950 shadow-2xl">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMenuAbierto(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <XIcon size={18} />
            </button>
            {navegacion}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/85 backdrop-blur">
          <div className={`mx-auto flex h-16 ${ancho} items-center justify-between gap-4 px-4 sm:px-6 lg:px-8`}>
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuAbierto(true)}
                aria-label="Abrir menú"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
              >
                <MenuIcon size={20} />
              </button>
              {esHerramienta && (
                <button
                  type="button"
                  onClick={() => navegar('resumen')}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronRightIcon size={14} className="rotate-180" />
                  <span className="hidden sm:inline">Resumen</span>
                </button>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-white">{titulo.titulo}</h1>
                <p className="truncate text-xs text-slate-500">{titulo.detalle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold text-slate-200">{operador?.user || 'Operador'}</p>
                <p className="text-[11px] text-slate-500">{operador?.email || 'Sesión activa'}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[11px] font-black text-amber-300 ring-1 ring-white/10">
                {iniciales(operador?.user)}
              </div>
            </div>
          </div>
        </header>

        <main className={`mx-auto w-full ${ancho} px-4 py-8 sm:px-6 lg:px-8`}>{children}</main>
      </div>
    </div>
  );
}
