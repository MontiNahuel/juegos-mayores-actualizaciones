/* Catálogo de planes con el diseño del mock: sellos por nivel, brillo y partículas. */
import { useId } from 'react';
import { IonIcon } from '@ionic/react';
import { diamondOutline } from 'ionicons/icons';
import { ModalBase } from '../../../COMPONENTS/MODALS/ModalBase';
import { useCatalogoPlanes } from '../../hooks/useCatalogoPlanes';
import { PlanCard } from './PlanCard';
import { PlanesCarga } from './PlanesCarga';
import { PeriodoTabs } from './PeriodoTabs';
import { nivelDe } from './nivelesPlan';
import './planesModal.css';

interface PlanesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlanesModal({ isOpen, onClose }: PlanesModalProps) {
  const titleId = useId();
  const {
    cargando,
    error,
    aviso,
    anualHabilitado,
    periodoActivo,
    cambio,
    planes,
    cargar,
    cambiarPeriodo,
    elegirPlan,
  } = useCatalogoPlanes(isOpen);

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

        <PlanesCarga
          cargando={cargando}
          error={error}
          planes={planes.length}
          onReintentar={() => void cargar()}
        />

        {!error && planes.length > 0 && (
          <>
            {anualHabilitado && (
              <PeriodoTabs
                periodoActivo={periodoActivo}
                cambio={cambio}
                onCambiar={cambiarPeriodo}
              />
            )}

            <ul className="planes-grid" aria-label="Planes disponibles">
              {planes.map((plan, indice) => (
                <PlanCard
                  key={plan.codigo}
                  plan={plan}
                  nivel={nivelDe(indice, planes.length)}
                  periodoActivo={periodoActivo}
                  cambio={cambio}
                  onElegir={elegirPlan}
                />
              ))}
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
