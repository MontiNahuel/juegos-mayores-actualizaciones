/* Muestra el botón para pedir una pista. */
import { IonIcon } from '@ionic/react';
import { bulbOutline } from 'ionicons/icons';

// Muestra el botón para pedir una pista.
export function HintButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled}
    title="Pista" aria-label="Pedir una pista"
    className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40">
    <IonIcon icon={bulbOutline} className="text-xl" aria-hidden="true" />
  </button>;
}
