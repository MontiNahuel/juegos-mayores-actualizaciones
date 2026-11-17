/* Identidad del jugador: inicial, nombre, alta y plan. */
import { IonIcon } from '@ionic/react';
import { ribbonOutline } from 'ionicons/icons';
import type { SessionUser } from '../../AUTH/sessionStore';
import { formatearMes } from '../utils/perfilUtils';

function formatearAlta(valor?: string | null): string | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

interface PerfilHeaderProps {
  usuario: SessionUser | null;
  esPremium: boolean;
  mesActual?: string;
}

export function PerfilHeader({ usuario, esPremium, mesActual }: PerfilHeaderProps) {
  const alta = formatearAlta(usuario?.dateStart);
  const inicial = (usuario?.name ?? '?').trim().charAt(0).toUpperCase();

  return (
    <header className="mt-3 mb-8 flex flex-wrap items-center gap-5 max-md:mt-2 max-md:gap-4">
      <span
        className="flex size-16 shrink-0 items-center justify-center rounded-full border border-[#8bd9cc]/35 bg-[#8bd9cc]/15 text-2xl font-extrabold text-[#8bd9cc]"
        aria-hidden="true"
      >
        {inicial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-xs font-semibold tracking-[.12em] text-menu-copy uppercase">
          Tu perfil
        </p>
        <h1 className="mt-1 mb-0! text-[2.125rem]! leading-[1.2]! font-bold! tracking-[-.02em] max-md:text-[1.75rem]!">
          {usuario?.name ?? 'Jugador'}
        </h1>
        <p className="mt-1.5 mb-0 text-base leading-normal text-menu-copy">
          {alta ? `Miembro desde ${alta}` : 'Sesión iniciada'}
          {mesActual ? ` · ${formatearMes(mesActual)} en curso` : ''}
        </p>
      </div>
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
          esPremium
            ? 'border-[#edd499]/45 bg-[#edd499]/10 text-[#edd499]'
            : 'border-[#8bd9cc]/40 bg-[#8bd9cc]/10 text-[#8bd9cc]'
        }`}
      >
        <IonIcon icon={ribbonOutline} aria-hidden="true" />
        {esPremium ? 'Plan Premium' : 'Plan básico'}
      </span>
    </header>
  );
}

export default PerfilHeader;
