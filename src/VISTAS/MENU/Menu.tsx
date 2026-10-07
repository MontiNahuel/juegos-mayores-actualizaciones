import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IonContent,
  IonPage,
} from '@ionic/react';
import {
  FlameIcon,
  StarIcon,
  PlayIcon,
  WordleIllustration,
  SudokuIllustration,
  CrosswordIllustration,
  RouteIllustration,
  CalendarCheckIcon,
} from '../COMPONENTS/Icons/Icons';

interface GameItem {
  id: string;
  title: string;
  category: string;
  benefit: string;
  description: string;
  illustration: React.ReactNode;
  isDaily?: boolean;
  completedToday?: boolean;
}

const Menu: React.FC = () => {
  const navigate = useNavigate();

  // Estado local para presentación (sin requerir backend todavía)
  const [user] = useState({
    name: 'Beatriz',
    streak: 5,
    points: 120,
  });

  const games: GameItem[] = [
    {
      id: 'wordle',
      title: 'Palabra del Día',
      category: 'Clásicos',
      benefit: 'Memoria y Vocabulario',
      description: 'Adivina la palabra oculta de 5 letras con pistas de colores. Cada día una nueva palabra para descubrir.',
      illustration: <WordleIllustration />,
      isDaily: true,
      completedToday: false,
    },
    {
      id: 'sudoku',
      title: 'Mini-Sudoku 4x4',
      category: 'Lógica',
      benefit: 'Concentración y Razonamiento',
      description: 'Completa los casilleros sin repetir números en filas ni columnas. Un formato ágil pensado para disfrutar.',
      illustration: <SudokuIllustration />,
      completedToday: false,
    },
    {
      id: 'crucigrama',
      title: 'Crucigrama Cotidiano',
      category: 'Palabras',
      benefit: 'Memoria Semántica',
      description: 'Resuelve pistas con palabras y recuerdos familiares de nuestra cultura en un tablero cómodo y claro.',
      illustration: <CrosswordIllustration />,
      completedToday: false,
    },
    {
      id: 'ruta-postal',
      title: 'La Ruta Postal',
      category: 'Agilidad',
      benefit: 'Atención y Visión Periférica',
      description: 'Encuentra el buzón en pantalla y sigue el recorrido del cartero para ejercitar tus reflejos visuales.',
      illustration: <RouteIllustration />,
      completedToday: false,
    },
  ];

  const handleStartGame = (gameId: string, gameTitle: string) => {
    if (gameId === 'wordle') {
      navigate('/juegos/wordle');
      return;
    }

    alert(`¡Próximamente! Estás por iniciar: ${gameTitle}`);
  };

  return (
    <IonPage className="bg-slate-50 font-sans">
      {/* ========================================================
          1. BARRA SUPERIOR DE NAVEGACIÓN (ASISTODO WEB)
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo e Identidad Institucional */}
            <div className="flex items-center gap-3.5">
              <img
                src="/asistodo-logo.svg"
                alt="Logo ASISTODO"
                className="w-12 h-12 object-contain rounded-xl shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#002B5E] tracking-tight leading-none">
                    ASISTODO
                  </span>
                  <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#002B5E] border border-blue-200">
                    Mente Activa
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Juegos de estimulación cognitiva
                </p>
              </div>
            </div>

            {/* Saludo y Píldoras de Logro (Racha y Puntos) */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:block text-right mr-1">
                <span className="text-base font-bold text-slate-800 block">
                  ¡Hola, {user.name}!
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Tu gimnasia mental de hoy
                </span>
              </div>

              {/* Píldora de Racha */}
              <div
                className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full text-amber-900 text-sm font-bold shadow-xs select-none"
                title="Días seguidos jugando"
              >
                <FlameIcon className="w-5 h-5 text-amber-600" />
                <span>{user.streak} días</span>
              </div>

              {/* Píldora de Puntos */}
              <div
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-emerald-900 text-sm font-bold shadow-xs select-none"
                title="Puntos acumulados"
              >
                <StarIcon className="w-5 h-5 text-emerald-600" />
                <span>{user.points} pts</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. CONTENIDO PRINCIPAL (VISTA WEB ESPACIOSA Y ACCESIBLE)
          ======================================================== */}
      <IonContent fullscreen className="bg-slate-50" style={{ '--background': '#f8fafc' } as React.CSSProperties}>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

          {/* ====================================================
              SECCIÓN HERO: DESAFÍO DEL DÍA DESTACADO
              ==================================================== */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#002B5E] via-[#0b3c75] to-[#1e40af] text-white p-6 sm:p-8 md:p-10 shadow-md">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-blue-100 text-xs sm:text-sm font-semibold border border-white/20">
                  <CalendarCheckIcon className="w-4 h-4 text-emerald-300" />
                  <span>Desafío de hoy disponible</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  Palabra del Día
                </h1>

                <p className="text-base sm:text-lg text-blue-100 leading-relaxed font-normal">
                  Ejercita tu memoria y deducción descubriendo la palabra de hoy. Solo te llevará unos minutos y suma puntos para tu racha.
                </p>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={() => handleStartGame('wordle', 'Palabra del Día')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#002B5E] text-lg font-black rounded-2xl shadow-lg hover:bg-blue-50 active:scale-98 transition-all cursor-pointer"
                >
                  <PlayIcon className="w-6 h-6 text-[#002B5E]" />
                  <span>Jugar Ahora</span>
                </button>
              </div>
            </div>
          </section>

          {/* ====================================================
              SECCIÓN: CATÁLOGO DE JUEGOS COGNITIVOS
              (Inspirado en el Mockup: Título + Tarjetas limpias)
              ==================================================== */}
          <section className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Elige tu pasatiempo para hoy
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-normal mt-1">
                Juegos tranquilos y sin límite de tiempo, diseñados para ejercitar la mente a tu propio ritmo.
              </p>
            </div>

            {/* Grid de Tarjetas de Juego */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {games.map((game) => (
                <article
                  key={game.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between overflow-hidden"
                >
                  {/* Encabezado de la Tarjeta e Ilustración SVG */}
                  <div className="p-6 pb-4">
                    {/* Píldoras de Categoría y Beneficio */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                        {game.category}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-[#002B5E] border border-blue-100 text-xs font-semibold">
                        {game.benefit}
                      </span>
                    </div>

                    {/* Contenedor de la Ilustración SVG (sin imágenes rotas) */}
                    <div className="w-full h-36 rounded-xl overflow-hidden mb-5 border border-slate-100 bg-slate-50 flex items-center justify-center">
                      {game.illustration}
                    </div>

                    {/* Título y Descripción Accesible */}
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug mb-2">
                      {game.title}
                    </h3>
                    <p className="text-base text-slate-600 leading-relaxed font-normal">
                      {game.description}
                    </p>
                  </div>

                  {/* Pie de la Tarjeta con Botón de Acción Amplio */}
                  <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Sin límite de tiempo
                    </span>
                    <button
                      onClick={() => handleStartGame(game.id, game.title)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#002B5E] hover:bg-blue-900 text-white font-bold text-base rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <PlayIcon className="w-4 h-4 text-white" />
                      <span>Comenzar</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ====================================================
              MENSAJE TRANQUILIZADOR (Validez para adultos mayores)
              ==================================================== */}
          <footer className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 text-center text-slate-600 space-y-1">
            <p className="text-sm sm:text-base font-semibold text-[#002B5E]">
              💡 Recuerda: acá no hay respuestas apuradas ni podés romper nada.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Podés jugar cuántas veces quieras y retomar tus partidas cuando gustes.
            </p>
          </footer>

        </main>
      </IonContent>
    </IonPage>
  );
};

export default Menu;
