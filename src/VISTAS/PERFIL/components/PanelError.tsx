/* Aviso de error de carga con reintento. */
import { IonIcon } from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import { PANEL } from './paneles';

interface PanelErrorProps {
  cargando: boolean;
  onReintentar: () => void;
}

export function PanelError({ cargando, onReintentar }: PanelErrorProps) {
  return (
    <div className={`${PANEL} mt-9 flex flex-wrap items-center justify-between gap-4`}>
      <p className="m-0 text-base leading-normal text-menu-copy">
        No pudimos cargar tus medallas. Revisá la conexión e intentá de nuevo.
      </p>
      <button
        type="button"
        onClick={onReintentar}
        disabled={cargando}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-[#526176] bg-[#263548] px-4 py-2.5 font-[inherit] text-[15px] text-menu-ink hover:bg-[#28384b] disabled:cursor-default disabled:opacity-60"
      >
        <IonIcon icon={refreshOutline} aria-hidden="true" />
        {cargando ? 'Reintentando…' : 'Reintentar'}
      </button>
    </div>
  );
}

export default PanelError;
