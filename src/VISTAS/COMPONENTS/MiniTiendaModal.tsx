import React, { useState } from 'react';
import { usePlayerEconomy, TiendaPaquete } from '../../context/PlayerEconomyContext';
import { IconHeart } from './GameHeader/LivesBadge';
import { StarIcon } from './Icons/Icons';

export interface MiniTiendaModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const MiniTiendaModal: React.FC<MiniTiendaModalProps> = ({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
}) => {
  const {
    isMiniTiendaOpen,
    cerrarMiniTienda,
    vidas,
    puntos,
    paquetesTienda,
    canjearVidas,
  } = usePlayerEconomy();

  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);

  const visible = propsIsOpen !== undefined ? propsIsOpen : isMiniTiendaOpen;
  const handleClose = propsOnClose || cerrarMiniTienda;

  if (!visible) return null;

  const handleCanjear = async (pack: TiendaPaquete) => {
    if (procesandoId) return;
    setProcesandoId(pack.id);
    setFeedback(null);

    const resultado = await canjearVidas(pack.id);
    setProcesandoId(null);

    if (resultado.success) {
      setFeedback({ tipo: 'exito', mensaje: resultado.message });
      setTimeout(() => {
        setFeedback(null);
      }, 3500);
    } else {
      setFeedback({ tipo: 'error', mensaje: resultado.message });
    }
  };

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        padding: '16px 16px max(calc(env(safe-area-inset-bottom, 0px) + 24px), 32px)',
        position: 'fixed',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxWidth: 480,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px 20px',
          textAlign: 'center',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: 18,
              background: '#FFF1F2',
              border: '2px solid #FECDD3',
              marginBottom: 10,
            }}
          >
            <IconHeart filled={true} size={28} />
          </div>
          <h2
            style={{
              color: '#0F172A',
              fontSize: 'clamp(20px, 4.5vw, 24px)',
              fontWeight: 900,
              margin: '0 0 4px',
              lineHeight: 1.2,
            }}
          >
            Tienda de Vidas
          </h2>
          <p
            style={{
              color: '#475569',
              fontSize: 13,
              margin: 0,
              fontWeight: 500,
            }}
          >
            Usá tus puntos acumulados para recuperar vidas y seguir jugando a todos los juegos.
          </p>
        </div>

        {/* Resumen de Estado Actual: Puntos y Vidas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '10px 14px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#166534',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <StarIcon size={18} className="text-amber-500 fill-amber-500" />
            <span>{puntos} puntos</span>
          </div>
          <span style={{ color: '#CBD5E1' }}>|</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: vidas > 0 ? '#BE123C' : '#94A3B8',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <IconHeart filled={vidas > 0} size={18} />
            <span>{vidas} {vidas === 1 ? 'vida' : 'vidas'}</span>
          </div>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 14,
              background: feedback.tipo === 'exito' ? '#ECFDF5' : '#FFF1F2',
              color: feedback.tipo === 'exito' ? '#065F46' : '#9F1239',
              border: `1px solid ${feedback.tipo === 'exito' ? '#A7F3D0' : '#FECDD3'}`,
            }}
          >
            {feedback.mensaje}
          </div>
        )}

        {/* Lista de Paquetes de Vidas */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflowY: 'auto',
            maxHeight: 280,
            padding: '2px 4px',
            marginBottom: 16,
          }}
        >
          {paquetesTienda.map((pack) => {
            const puedeComprar = puntos >= pack.puntos;
            const esProcesando = procesandoId === pack.id;

            return (
              <div
                key={pack.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: pack.popular ? '#FFFBEB' : '#FFFFFF',
                  border: `2px solid ${pack.popular ? '#F59E0B' : '#E2E8F0'}`,
                  borderRadius: 16,
                  padding: '12px 14px',
                  boxShadow: pack.popular ? '0 4px 12px rgba(245, 158, 11, 0.12)' : 'none',
                  position: 'relative',
                  textAlign: 'left',
                }}
              >
                {/* Info del paquete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: '#FFE4E6',
                    }}
                  >
                    <IconHeart filled={true} size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                        +{pack.vidas} {pack.vidas === 1 ? 'Vida' : 'Vidas'}
                      </span>
                      {pack.badge && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '2px 6px',
                            borderRadius: 6,
                          }}
                        >
                          {pack.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                      Costo: <strong style={{ color: '#D97706' }}>{pack.puntos} pts</strong>
                      {pack.descuento && (
                        <span style={{ marginLeft: 6, color: '#16A34A', fontWeight: 700 }}>
                          ({pack.descuento})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón de Canje */}
                <button
                  type="button"
                  onClick={() => handleCanjear(pack)}
                  disabled={!puedeComprar || Boolean(procesandoId)}
                  style={{
                    background: puedeComprar ? '#294C6B' : '#F1F5F9',
                    color: puedeComprar ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    borderRadius: 12,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: puedeComprar ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease',
                    minWidth: 100,
                  }}
                  className={puedeComprar ? 'hover:bg-[#1f3a52] active:scale-95' : ''}
                >
                  {esProcesando ? (
                    'Canjeando...'
                  ) : puedeComprar ? (
                    'Canjear'
                  ) : (
                    `Faltan ${pack.puntos - puntos}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Consejos para obtener puntos */}
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 14,
            padding: '10px 12px',
            fontSize: 12,
            color: '#166534',
            textAlign: 'left',
            marginBottom: 16,
            lineHeight: 1.35,
          }}
        >
          💡 <strong>¿Cómo ganar más puntos?</strong> Cada vez que juegues y ganes cualquier desafío diario, acumularás puntos de forma automática.
        </div>

        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: 14,
            color: '#334155',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 800,
            padding: '12px 20px',
            width: '100%',
          }}
          className="hover:bg-slate-200 active:scale-98 transition"
        >
          Volver a jugar
        </button>
      </div>
    </div>
  );
};
export default MiniTiendaModal;
