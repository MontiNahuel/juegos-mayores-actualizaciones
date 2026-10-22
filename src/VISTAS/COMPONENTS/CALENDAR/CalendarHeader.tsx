import type { CSSProperties } from 'react';
import { IonHeader, IonToolbar } from '@ionic/react';
import { IconChevronLeft } from './icons';

interface CalendarHeaderProps {
  title: string;
  onBack: () => void;
  primaryColor?: string;
}

export function CalendarHeader({ title, onBack, primaryColor = '#294C6B' }: CalendarHeaderProps) {
  return <IonHeader className="shadow-[0_2px_10px_#173b631f]">
    <IonToolbar className="[--background:#FFFFFF] [--border-width:0]">
      <div className="mx-auto grid min-h-[74px] w-full max-w-[1180px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-[var(--calendar-primary)] sm:grid-cols-[1fr_minmax(0,auto)_1fr]"
        style={{ '--calendar-primary': primaryColor } as CSSProperties}>
        <button type="button" onClick={onBack} aria-label="Volver al menú principal"
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 justify-self-start rounded-md border border-[#DEE3EA] bg-[#F4F6F9] px-3 text-sm font-bold transition-colors hover:bg-[#DEE3EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53BFC9] sm:px-4">
          <IconChevronLeft size={20} />
          <span className="hidden sm:inline">Menú</span>
        </button>
        <h1 className="m-0 text-center text-[clamp(16px,4vw,21px)] leading-tight font-extrabold">{title}</h1>
        <img alt="ASISTODO" src="/asistodo-logo.svg" className="block size-11 justify-self-end object-contain" />
      </div>
    </IonToolbar>
  </IonHeader>;
}
