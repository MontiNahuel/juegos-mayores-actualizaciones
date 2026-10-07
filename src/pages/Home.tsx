import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon
} from '@ionic/react';
import { gameControllerOutline, flameOutline, ribbonOutline, settingsOutline, homeOutline } from 'ionicons/icons';

const Home: React.FC = () => {
  // Estado simple para probar interactividad
  const [activeTab, setActiveTab] = useState<'home' | 'wordle' | 'stats'>('wordle');
  const [currentGuess, setCurrentGuess] = useState<string>('CAS');
  
  // Tablero de ejemplo accesible
  const rows = [
    [
      { letter: 'M', status: 'absent' },
      { letter: 'A', status: 'correct' },
      { letter: 'T', status: 'absent' },
      { letter: 'E', status: 'present' },
      { letter: 'S', status: 'absent' },
    ],
    [
      { letter: 'P', status: 'absent' },
      { letter: 'A', status: 'correct' },
      { letter: 'N', status: 'correct' },
      { letter: 'E', status: 'correct' },
      { letter: 'L', status: 'correct' },
    ],
    // Fila actual
    [
      { letter: 'C', status: 'current' },
      { letter: 'A', status: 'current' },
      { letter: 'S', status: 'current' },
      { letter: '', status: 'empty' },
      { letter: '', status: 'empty' },
    ],
    // Filas vacías
    [
      { letter: '', status: 'empty' },
      { letter: '', status: 'empty' },
      { letter: '', status: 'empty' },
      { letter: '', status: 'empty' },
      { letter: '', status: 'empty' },
    ],
    [
      { letter: '', status: 'empty' },
      { letter: '', status: 'empty' },
      { letter: '', status: 'empty' },
      { letter: '', status: 'empty' },
      { letter: '', status: 'empty' },
    ],
  ];

  const keyboardKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['ENVIAR', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BORRAR']
  ];

  return (
    <IonPage className="bg-slate-50">
      {/* ========================================================
          1. BARRA SUPERIOR PARA ESCRITORIO (WEB)
          Se muestra en pantallas medianas/grandes (PC / Laptop)
          ======================================================== */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-xs">
            🧠
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">Mente Activa</h1>
            <p className="text-xs text-slate-500 font-medium">Estimulación neurocognitiva diaria</p>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('home')}
            className={`font-semibold text-sm transition-colors ${activeTab === 'home' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Inicio y Catálogo
          </button>
          <button
            onClick={() => setActiveTab('wordle')}
            className={`font-semibold text-sm transition-colors ${activeTab === 'wordle' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Palabra del Día
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`font-semibold text-sm transition-colors ${activeTab === 'stats' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Mi Progreso
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 text-amber-800 text-sm font-semibold">
            <span>🔥</span> Racha: 5 días
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-800 text-sm font-semibold">
            <span>⭐</span> 28 estrellas
          </div>
        </div>
      </header>

      {/* ========================================================
          2. CABECERA NATIVA PARA CELULAR (APK / MÓVIL)
          Se muestra únicamente en pantallas pequeñas (móviles)
          ======================================================== */}
      <IonHeader className="md:hidden">
        <IonToolbar color="light">
          <IonTitle className="font-bold text-lg text-slate-800">
            Palabra del Día
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* ========================================================
          3. CONTENIDO CENTRAL RESPONSIVO (El juego interactivo)
          ======================================================== */}
      <IonContent fullscreen className="bg-slate-50" style={{ '--background': '#f8fafc' }}>
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-between min-h-full">
          
          {/* Tarjeta de consigna e info del día */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-xs border border-slate-200 mb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Desafío Diario</span>
              <h2 className="text-lg font-bold text-slate-800">Palabra de 5 Letras</h2>
              <p className="text-xs text-slate-500">Pista: Relacionado con el hogar familiar</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-indigo-600">3/6</span>
              <p className="text-xs text-slate-400">Intentos</p>
            </div>
          </div>

          {/* Tablero accesible con letras grandes y contraste alto */}
          <div className="flex flex-col gap-2.5 my-2">
            {rows.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-2.5 justify-center">
                {row.map((cell, cIdx) => {
                  let bgStyle = 'bg-white border-2 border-slate-300 text-slate-800';
                  if (cell.status === 'correct') {
                    bgStyle = 'bg-emerald-600 border-2 border-emerald-600 text-white font-extrabold shadow-xs';
                  } else if (cell.status === 'present') {
                    bgStyle = 'bg-amber-500 border-2 border-amber-500 text-white font-extrabold shadow-xs';
                  } else if (cell.status === 'absent') {
                    bgStyle = 'bg-slate-400 border-2 border-slate-400 text-white font-medium';
                  } else if (cell.status === 'current') {
                    bgStyle = 'bg-white border-2 border-indigo-600 text-indigo-900 font-extrabold scale-105';
                  }

                  return (
                    <div
                      key={cIdx}
                      className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold transition-all ${bgStyle}`}
                    >
                      {cell.letter}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Teclado en pantalla (Táctil y adaptado a adultos mayores) */}
          <div className="w-full mt-4 flex flex-col gap-2">
            {keyboardKeys.map((row, kIdx) => (
              <div key={kIdx} className="flex justify-center gap-1.5 sm:gap-2">
                {row.map((key) => {
                  const isSpecial = key === 'ENVIAR' || key === 'BORRAR';
                  return (
                    <button
                      key={key}
                      className={`h-12 sm:h-14 font-bold text-sm sm:text-base rounded-lg transition-transform active:scale-95 shadow-xs flex items-center justify-center select-none ${
                        isSpecial
                          ? 'px-3 sm:px-4 bg-slate-200 text-slate-800 text-xs sm:text-sm font-extrabold'
                          : 'w-8 sm:w-10 bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Espaciador inferior para no chocar con la barra móvil */}
          <div className="h-16 md:hidden" />
        </div>
      </IonContent>

      {/* ========================================================
          4. BARRA INFERIOR DE PESTAÑAS PARA CELULAR (APK / MÓVIL)
          Se muestra únicamente en pantallas pequeñas (móviles)
          ======================================================== */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-2 px-4 shadow-lg z-50">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${activeTab === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
        >
          <IonIcon icon={homeOutline} className="text-xl" />
          <span className="text-xs">Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab('wordle')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${activeTab === 'wordle' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
        >
          <IonIcon icon={gameControllerOutline} className="text-xl" />
          <span className="text-xs">Reto Hoy</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${activeTab === 'stats' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
        >
          <IonIcon icon={ribbonOutline} className="text-xl" />
          <span className="text-xs">Progreso</span>
        </button>
      </footer>
    </IonPage>
  );
};

export default Home;
