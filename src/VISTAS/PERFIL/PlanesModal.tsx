/* Muestra los planes configurados y deja la compra para cuando exista la pasarela. */
import { useCallback, useEffect, useId, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  checkmarkOutline,
  diamondOutline,
  refreshOutline,
  timeOutline,
} from 'ionicons/icons';
import { ModalBase } from '../COMPONENTS/MODALS/ModalBase';
import { formatearPrecioPlan } from './perfilUtils';
import {
  fetchPlanes,
  type CatalogoPlanes,
  type PeriodoCobro,
  type PlanSuscripcion,
} from './planesService';

interface PlanesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERIODOS: { id: PeriodoCobro; etiqueta: string }[] = [
  { id: 'mensual', etiqueta: 'Mensual' },
  { id: 'anual', etiqueta: 'Anual' },
];

function textoDescuento(valor: number): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return '';
  return `${Number(numero.toFixed(2)).toLocaleString('es-AR')}% de descuento`;
}

export function PlanesModal({ isOpen, onClose }: PlanesModalProps) {
  const titleId = useId();
  const [catalogo, setCatalogo] = useState<CatalogoPlanes | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const [aviso, setAviso] = useState('');
  const [periodo, setPeriodo] = useState<PeriodoCobro>('mensual');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);
    const datos = await fetchPlanes();
    setCargando(false);
    if (datos) {
      setCatalogo(datos);
    } else {
      setError(true);
    }
  }, []);

  // El catálogo lo administra el panel: al abrir se relee para no mostrar planes viejos.
  useEffect(() => {
    if (!isOpen) {
      setAviso('');
      return;
    }
    setAviso('');
    setPeriodo('mensual');
    void cargar();
  }, [isOpen, cargar]);

  const anualHabilitado = catalogo?.anual_habilitado === true;
  const periodoActivo: PeriodoCobro = anualHabilitado ? periodo : 'mensual';
  const planes = catalogo?.planes ?? [];

  const precioDe = (plan: PlanSuscripcion) =>
    formatearPrecioPlan(
      periodoActivo === 'anual' ? plan.precio_anual : plan.precio,
      periodoActivo,
    );

  const elegirPlan = (plan: PlanSuscripcion) => {
    const modalidad = periodoActivo === 'anual' ? ' en su modalidad anual' : '';
    setAviso(
      `La compra de “${plan.nombre}”${modalidad} va a estar disponible cuando conectemos la pasarela de pagos.`,
    );
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} labelledBy={titleId} size="lg">
      <div className="text-left text-slate-700">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <IonIcon icon={diamondOutline} className="text-base" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="m-0 text-base leading-tight font-bold text-[#294C6B]">
              Mejorar suscripción
            </h2>
            <p className="m-0 mt-0.5 text-xs leading-tight font-medium text-slate-400">
              Elegí el plan que quieras para tu cuenta
            </p>
          </div>
        </div>

        {cargando && catalogo === null && (
          <div className="flex flex-col items-center gap-2 py-10" role="status">
            <IonIcon icon={refreshOutline} className="animate-spin text-xl text-slate-400" aria-hidden="true" />
            <p className="m-0 text-sm font-medium text-slate-500">Cargando planes…</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
            <p className="m-0 text-sm font-medium text-rose-700">
              No pudimos cargar los planes. Revisá la conexión e intentá de nuevo.
            </p>
            <button
              type="button"
              onClick={() => void cargar()}
              disabled={cargando}
              className="mt-2 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-default disabled:opacity-60"
            >
              <IonIcon icon={refreshOutline} aria-hidden="true" />
              {cargando ? 'Reintentando…' : 'Reintentar'}
            </button>
          </div>
        )}

        {!cargando && !error && planes.length === 0 && (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-500">
            Todavía no hay planes disponibles. Volvé a intentarlo más adelante.
          </p>
        )}

        {!error && planes.length > 0 && (
          <>
            {anualHabilitado && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div
                  role="group"
                  aria-label="Periodo de cobro"
                  className="inline-flex self-start rounded-xl border border-slate-200 bg-slate-50 p-1"
                >
                  {PERIODOS.map(({ id, etiqueta }) => {
                    const activo = periodoActivo === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => {
                          setPeriodo(id);
                          setAviso('');
                        }}
                        className={`min-h-9 cursor-pointer rounded-lg px-4 font-[inherit] text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294C6B] ${
                          activo
                            ? 'bg-[#294C6B] text-white shadow-sm'
                            : 'text-slate-500 hover:text-[#294C6B]'
                        }`}
                      >
                        {etiqueta}
                      </button>
                    );
                  })}
                </div>
                <p className="m-0 text-[11px] font-medium text-slate-400">
                  El cobro anual se paga una vez por doce meses.
                </p>
              </div>
            )}

            <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Planes disponibles">
              {planes.map((plan) => {
                const descuento = periodoActivo === 'anual' ? textoDescuento(plan.descuento_anual_pct) : '';
                return (
                  <li
                    key={plan.codigo}
                    className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="m-0 text-base leading-tight font-bold text-[#294C6B]">
                          {plan.nombre}
                        </h3>
                        {plan.descripcion && (
                          <p className="m-0 mt-1 text-xs leading-snug text-slate-500">
                            {plan.descripcion}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-[#294C6B] tabular-nums">
                        {precioDe(plan)}
                      </span>
                    </div>

                    {descuento && (
                      <p className="m-0 mt-2 inline-flex self-start rounded-full bg-[#8FD9CC]/15 px-2 py-0.5 text-[10px] font-bold text-[#2f7d6f]">
                        {descuento}
                      </p>
                    )}

                    {plan.beneficios.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {plan.beneficios.map((beneficio) => (
                          <li
                            key={beneficio}
                            className="flex items-start gap-1.5 text-xs leading-snug text-slate-600"
                          >
                            <IonIcon
                              icon={checkmarkOutline}
                              className="mt-0.5 shrink-0 text-[#294C6B]"
                              aria-hidden="true"
                            />
                            <span>{beneficio}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto pt-3">
                      {plan.habilitado ? (
                        <button
                          type="button"
                          onClick={() => elegirPlan(plan)}
                          className="min-h-11 w-full cursor-pointer rounded-xl border-0 bg-[#294C6B] px-4 py-2.5 font-[inherit] text-sm font-bold text-white transition-colors hover:bg-[#1f3a52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294C6B]"
                        >
                          Elegir {plan.nombre}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          aria-label={`${plan.nombre}: próximamente`}
                          className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 font-[inherit] text-sm font-semibold text-slate-400"
                        >
                          <IonIcon icon={timeOutline} aria-hidden="true" />
                          Próximamente
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {aviso && (
          <p
            role="status"
            className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium leading-snug text-slate-600"
          >
            {aviso}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-[#294C6B] transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294C6B]"
        >
          Cerrar
        </button>
      </div>
    </ModalBase>
  );
}

export default PlanesModal;
