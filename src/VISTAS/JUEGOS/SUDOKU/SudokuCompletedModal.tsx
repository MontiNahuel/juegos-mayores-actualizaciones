import React from 'react';

interface ModalProps {
  isGameOver?: boolean;
  stars?: number;
  dateStr: string;
  onRestart: () => void;
  onExit: () => void;
}

export const SudokuCompletedModal: React.FC<ModalProps> = ({
  isGameOver,
  stars = 3,
  dateStr,
  onRestart,
  onExit,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 border border-[#E2E8F0]">
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-inner ${
          isGameOver ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {isGameOver ? '💔' : '🧩'}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-[#1E3A5F]">
            {isGameOver ? '¡Sin Vidas Restantes!' : '¡Desafío Completado!'}
          </h3>
          <p className="text-sm text-[#64748B] mt-1">{dateStr}</p>
        </div>

        {!isGameOver && (
          <div className="flex justify-center gap-1 text-3xl">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < stars ? 'text-amber-400' : 'text-slate-200'}>
                ★
              </span>
            ))}
          </div>
        )}

        <p className="text-base text-[#334155] leading-relaxed">
          {isGameOver
            ? 'Has consumido todas tus vidas en este intento. ¡No te preocupes! Podés intentarlo nuevamente cuando quieras.'
            : '¡Excelente trabajo! Has ejercitado tu concentración y completado con éxito el tablero de hoy.'}
        </p>

        <div className="flex flex-col gap-2 pt-2">
          {isGameOver ? (
            <button
              type="button"
              onClick={onRestart}
              className="w-full h-12 bg-[#0284C7] hover:bg-[#0369A1] active:scale-98 text-white text-base font-bold rounded-2xl shadow-md transition-all"
            >
              🔄 Intentar de Nuevo
            </button>
          ) : null}

          <button
            type="button"
            onClick={onExit}
            className="w-full h-12 bg-[#1E3A5F] hover:bg-[#2A4D7A] active:scale-98 text-white text-base font-bold rounded-2xl shadow-md transition-all"
          >
            Volver al Calendario
          </button>
        </div>
      </div>
    </div>
  );
};

