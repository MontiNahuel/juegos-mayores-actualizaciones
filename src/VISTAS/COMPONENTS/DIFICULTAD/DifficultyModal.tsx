import React from 'react';
import { DifficultyModalProps, DEFAULT_DIFFICULTY_OPTIONS } from './types';

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  title = 'Elegí tu Desafío',
  subtitle,
  categoryBadge = 'Cuaderno de Mente Activa',
  options = DEFAULT_DIFFICULTY_OPTIONS,
  onSelectDifficulty,
  onClose,
}) => {
  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.60)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        padding: '16px 14px max(calc(env(safe-area-inset-bottom, 0px) + 24px), 48px)',
        position: 'fixed',
        zIndex: 9999,
      }}
    >
      <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-[#E2E8F0] animate-fade-in text-left relative">
        {/* Botón de Cierre Superior ✕ */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            width: 36,
            height: 36,
            borderRadius: '9999px',
            backgroundColor: '#F1F5F9',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            zIndex: 10,
          }}
          className="hover:bg-slate-200 active:scale-95 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
          title="Cerrar ventana"
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        {/* Encabezado Editorial */}
        <div className="text-center pt-1 pb-1">
          <h2 className="text-2xl sm:text-[26px] font-black text-[#1E3A5F] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 flex items-center justify-center gap-1">
              <span></span> {subtitle}
            </p>
          )}
        </div>

        {/* Lista de Opciones de Dificultad (Opción C - Editorial) */}
        <div className="space-y-3 pt-1">
          {options.map((opt) => (
            <button
              key={opt.level}
              type="button"
              onClick={() => onSelectDifficulty(opt.level)}
              style={{
                boxSizing: 'border-box',
                width: '100%',
                minHeight: '76px',
                padding: '14px 16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderLeft: `6px solid ${opt.leftBorderHex || (opt.level === 1 ? '#10B981' : opt.level === 2 ? '#F59E0B' : '#F43F5E')}`,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              className="hover:bg-slate-50/90 active:scale-98 transition-all shadow-xs group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {opt.title}
                  </h3>
                  {opt.stars && (
                    <span className="text-amber-500 text-xs sm:text-sm tracking-widest font-black select-none">
                      {opt.stars}
                    </span>
                  )}
                  {opt.badge && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 font-medium leading-relaxed mt-0.5">
                  {opt.description}
                </p>
              </div>

              {/* Botón Circular con Flecha de Acción */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${opt.actionBgColor} ${opt.actionTextColor} group-hover:text-white ${opt.actionHoverBgColor} flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 transition-colors shadow-2xs`}
                aria-hidden="true"
              >
                ›
              </div>
            </button>
          ))}
        </div>

        {/* Botón Inferior Volver al Calendario */}
        <button
          type="button"
          onClick={onClose}
          style={{
            boxSizing: 'border-box',
            width: '100%',
            minHeight: '46px',
            backgroundColor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            marginTop: '8px',
          }}
          className="hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-sm transition-colors"
        >
          <span>‹</span> Volver al Calendario
        </button>
      </div>
    </div>
  );
};

export default DifficultyModal;
