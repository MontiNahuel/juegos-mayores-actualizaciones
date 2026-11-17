/* Tarjetas de racha, puntos y suscripción. */
import { IonIcon } from '@ionic/react';
import { flameOutline, ribbonOutline, sparklesOutline, starOutline } from 'ionicons/icons';
import { PANEL } from './paneles';

interface ResumenTarjetasProps {
  racha: number;
  rachaHoyIngresada: boolean;
  puntos: number;
  isLoading: boolean;
  esPremium: boolean;
  diasDesbloqueados: string[];
  onMejorar: () => void;
}

export function ResumenTarjetas({
  racha,
  rachaHoyIngresada,
  puntos,
  isLoading,
  esPremium,
  diasDesbloqueados,
  onMejorar,
}: ResumenTarjetasProps) {
  return (
    <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1 max-md:gap-4">
      <section className={`${PANEL} flex flex-col gap-1`} aria-label="Racha actual">
        <span className="flex items-center gap-2 text-sm text-menu-copy">
          <IonIcon icon={flameOutline} className="text-[#edd499]" aria-hidden="true" />
          Racha actual
        </span>
        <strong className="text-[2rem] leading-tight font-bold text-[#edd499] tabular-nums">
          {racha}
          <span className="ml-1.5 text-base font-semibold">{racha === 1 ? 'día' : 'días'}</span>
        </strong>
        <span className="text-sm leading-snug text-menu-copy">
          {rachaHoyIngresada ? 'Hoy ya contás para la racha.' : 'Ingresá hoy para mantenerla.'}
        </span>
      </section>

      <section className={`${PANEL} flex flex-col gap-1`} aria-label="Puntos acumulados">
        <span className="flex items-center gap-2 text-sm text-menu-copy">
          <IonIcon icon={starOutline} className="text-[#edd499]" aria-hidden="true" />
          Puntos
        </span>
        <strong className="text-[2rem] leading-tight font-bold text-[#edd499] tabular-nums">
          {isLoading ? '…' : puntos.toLocaleString('es-AR')}
        </strong>
        <span className="text-sm leading-snug text-menu-copy">
          Para desbloquear días y pedir pistas.
        </span>
      </section>

      <section className={`${PANEL} flex flex-col gap-1`} aria-label="Suscripción">
        <span className="flex items-center gap-2 text-sm text-menu-copy">
          <IonIcon icon={ribbonOutline} className="text-[#8bd9cc]" aria-hidden="true" />
          Suscripción
        </span>
        <strong className="text-[2rem] leading-tight font-bold">
          {esPremium ? 'Premium' : 'Básica'}
        </strong>
        <span className="text-sm leading-snug text-menu-copy">
          {esPremium
            ? 'Acceso completo al archivo de desafíos.'
            : `${diasDesbloqueados.length} ${
                diasDesbloqueados.length === 1 ? 'día desbloqueado' : 'días desbloqueados'
              } con puntos.`}
        </span>
        {!esPremium && (
          <button
            type="button"
            onClick={onMejorar}
            className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 self-start rounded-[10px] border border-[#edd499]/50 bg-[#edd499]/10 px-3.5 py-2 font-[inherit] text-sm font-bold text-[#edd499] transition-colors hover:bg-[#edd499]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#edd499]"
          >
            <IonIcon icon={sparklesOutline} aria-hidden="true" />
            Mejorar suscripción
          </button>
        )}
      </section>
    </div>
  );
}

export default ResumenTarjetas;
