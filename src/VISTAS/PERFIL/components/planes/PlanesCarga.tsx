/* Estado del catálogo de planes: carga, reintento y catálogo vacío. */
import { IonIcon } from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';

interface PlanesCargaProps {
  cargando: boolean;
  error: boolean;
  planes: number;
  onReintentar: () => void;
}

export function PlanesCarga({ cargando, error, planes, onReintentar }: PlanesCargaProps) {
  if (cargando && planes === 0 && !error) {
    return (
      <div className="flex flex-col items-center gap-2 py-10" role="status">
        <IonIcon
          icon={refreshOutline}
          className="animate-spin text-xl text-slate-400"
          aria-hidden="true"
        />
        <p className="m-0 text-sm font-medium text-slate-500">Cargando planes…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
        <p className="m-0 text-sm font-medium text-rose-700">
          No pudimos cargar los planes. Revisá la conexión e intentá de nuevo.
        </p>
        <button
          type="button"
          onClick={onReintentar}
          disabled={cargando}
          className="mt-2 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-default disabled:opacity-60"
        >
          <IonIcon icon={refreshOutline} aria-hidden="true" />
          {cargando ? 'Reintentando…' : 'Reintentar'}
        </button>
      </div>
    );
  }

  if (!cargando && planes === 0) {
    return (
      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-500">
        Todavía no hay planes disponibles. Volvé a intentarlo más adelante.
      </p>
    );
  }

  return null;
}
