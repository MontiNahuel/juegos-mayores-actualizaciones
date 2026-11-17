/* Tarjeta de un plan: sello de nivel, precio del periodo y beneficios. */
import { IonIcon } from '@ionic/react';
import { star } from 'ionicons/icons';
import type { PeriodoCobro, PlanSuscripcion } from '../../services/planesService';
import { NIVELES, type Nivel } from './nivelesPlan';
import { precioDelPeriodo, type CambioPeriodo } from './planesPeriodo';
import { Particulas } from './Particulas';

function textoDescuento(valor: number): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return '';
  return `${Number(numero.toFixed(2)).toLocaleString('es-AR')}% OFF`;
}

interface PlanCardProps {
  plan: PlanSuscripcion;
  nivel: Nivel;
  periodoActivo: PeriodoCobro;
  cambio: CambioPeriodo | null;
  onElegir: (plan: PlanSuscripcion) => void;
}

export function PlanCard({ plan, nivel, periodoActivo, cambio, onElegir }: PlanCardProps) {
  const { etiqueta, pips } = NIVELES[nivel];
  const descuento = textoDescuento(plan.descuento_anual_pct);
  const cobraAnual = periodoActivo === 'anual';
  const descuentoSaliente = cambio?.de === 'anual' && !cobraAnual;

  return (
    <li className="planes-card" data-nivel={nivel}>
      <span className="planes-medal" data-pips={pips} aria-hidden="true">
        <span className="planes-pips">
          {(pips === 3 ? [1, 2] : [pips]).map((cantidad) => (
            <span key={cantidad} className="planes-pips-row">
              {Array.from({ length: cantidad }, (_, pip) => (
                <IonIcon key={pip} icon={star} />
              ))}
            </span>
          ))}
        </span>
      </span>
      <Particulas />

      <div className="planes-head">
        <div className="planes-head-text">
          <p className="planes-kicker">{etiqueta}</p>
          <h3 className="planes-name">{plan.nombre}</h3>
          {plan.descripcion && <p className="planes-desc">{plan.descripcion}</p>}
        </div>
        <span className="planes-price">
          <span
            key={cambio ? `activo-${cambio.id}` : 'activo'}
            className={`planes-price-valor${cambio ? ' planes-price-valor-entra' : ''}`}
            data-estado="activo"
          >
            {precioDelPeriodo(plan, periodoActivo)}
          </span>
          {cambio && (
            <span
              key={`saliente-${cambio.id}`}
              className="planes-price-valor planes-price-valor-sale"
              aria-hidden="true"
              data-estado="saliente"
            >
              {precioDelPeriodo(plan, cambio.de)}
            </span>
          )}
        </span>
      </div>

      {(cobraAnual || descuentoSaliente) && descuento && (
        <span
          key={`descuento-${cobraAnual ? 'activo' : 'saliente'}-${cambio?.id ?? 0}`}
          className={`planes-discount${
            cobraAnual
              ? cambio
                ? ' planes-discount-entra'
                : ''
              : ' planes-discount-sale'
          }`}
          aria-hidden={cobraAnual ? undefined : true}
        >
          {descuento}
        </span>
      )}

      {plan.beneficios.length > 0 && (
        <ul className="planes-benefits">
          {plan.beneficios.map((beneficio) => (
            <li key={beneficio}>{beneficio}</li>
          ))}
        </ul>
      )}

      <div className="planes-cta">
        {plan.habilitado ? (
          <button
            type="button"
            onClick={() => onElegir(plan)}
            className="planes-btn planes-btn-primary"
          >
            Elegir {plan.nombre}
          </button>
        ) : (
          <button
            type="button"
            disabled
            aria-label={`${plan.nombre}: próximamente`}
            className="planes-btn planes-btn-ghost"
          >
            Próximamente
          </button>
        )}
      </div>
    </li>
  );
}
