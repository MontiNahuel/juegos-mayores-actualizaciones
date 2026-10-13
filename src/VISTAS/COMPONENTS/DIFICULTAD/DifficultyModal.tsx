import React from 'react';
import { DifficultyModalProps, DifficultyLevel, DEFAULT_DIFFICULTY_OPTIONS } from './types';

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  title = 'Elegí la Dificultad',
  subtitle,
  icon = '⭐',
  options = DEFAULT_DIFFICULTY_OPTIONS,
  onSelectDifficulty,
  onClose,
}) => {
  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        padding: '16px 14px max(calc(env(safe-area-inset-bottom, 0px) + 24px), 48px)',
        position: 'fixed',
        zIndex: 9999,
      }}
    >
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-[#E2E8F0] animate-fade-in text-left">
        {/* Encabezado */}
        <div className="text-center">
          <div className="w-14 h-14 bg-[#E0F2FE] text-[#0284C7] rounded-full mx-auto flex items-center justify-center text-2xl shadow-inner mb-2">
            {icon}
          </div>
          <h2 className="text-2xl font-black text-[#1E3A5F]">{title}</h2>
          {subtitle && (
            <p className="text-sm font-semibold text-[#64748B] mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Lista de opciones de dificultad (Niveles 1, 2, 3) */}
        <div className="space-y-3 pt-1">
          {options.map(opt => (
            <button
              key={opt.level}
              type="button"
              onClick={() => onSelectDifficulty(opt.level)}
              className={`w-full min-h-[70px] p-4 rounded-2xl border-2 text-left flex items-start gap-3.5 transition-all shadow-sm active:scale-98 ${
                opt.borderColor || 'border-slate-200'
              } ${opt.bgColor || 'bg-slate-50'}`}
            >
              <span className="text-2xl mt-0.5" aria-hidden="true">
                {opt.icon || '🎯'}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`text-lg font-bold ${opt.textColor || 'text-slate-900'}`}>
                    {opt.title}
                  </h3>
                  {opt.badge && (
                    <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Botón Volver / Cancelar */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-sm rounded-xl transition-colors mt-2"
        >
          Volver al Calendario
        </button>
      </div>
    </div>
  );
};

export default DifficultyModal;
