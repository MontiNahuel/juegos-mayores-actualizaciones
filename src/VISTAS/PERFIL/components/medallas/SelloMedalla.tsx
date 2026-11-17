/* Sello de calificación: el número manda y la letra queda estampada con su aro. */
import type { Calificacion } from '../../utils/perfilUtils';

const COLOR_SELLO: Record<Calificacion, string> = {
  S: 'text-[#F0CC80] border-[#F0CC80]/25 bg-[#F0CC80]/10',
  A: 'text-[#8FD9CC] border-[#8FD9CC]/25 bg-[#8FD9CC]/10',
  B: 'text-[#A9C8EE] border-[#A9C8EE]/25 bg-[#A9C8EE]/10',
  C: 'text-[#C3CEDA] border-[#C3CEDA]/25 bg-[#C3CEDA]/10',
  F: 'text-[#E79586] border-[#E79586]/25 bg-[#E79586]/10',
};

/** Mismo aro punteado que usa el calendario para la S. */
const ARO_S = (
  <svg
    className="absolute inset-0 size-full opacity-50"
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.6 2.8" />
    <circle cx="24" cy="24" r="16.2" stroke="currentColor" strokeWidth="1" />
    <circle cx="37.2" cy="10.8" r="1.2" fill="currentColor" />
    <circle cx="37.2" cy="37.2" r="1.2" fill="currentColor" />
    <circle cx="10.8" cy="37.2" r="1.2" fill="currentColor" />
    <circle cx="10.8" cy="10.8" r="1.2" fill="currentColor" />
  </svg>
);

interface SelloMedallaProps {
  calificacion: Calificacion;
  cantidad: number;
}

export function SelloMedalla({ calificacion, cantidad }: SelloMedallaProps) {
  const etiqueta = `${cantidad} ${cantidad === 1 ? 'medalla' : 'medallas'} ${calificacion}`;

  return (
    <li
      aria-label={etiqueta}
      className={`relative block h-[60px] min-w-0 flex-1 overflow-hidden rounded-xl border px-2.5 py-2.5 tabular-nums max-[520px]:h-[58px] max-[520px]:px-1.5 max-[520px]:py-1.5 ${COLOR_SELLO[calificacion]} ${
        cantidad === 0 ? 'opacity-40' : ''
      }`}
    >
      <span
        aria-hidden="true"
        className="block text-[26px] leading-none font-black max-[520px]:text-[21px]"
      >
        {cantidad}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[7px] bottom-1.5 flex size-8 items-center justify-center max-[520px]:right-1 max-[520px]:bottom-1 max-[520px]:size-[26px]"
      >
        {calificacion === 'S' && ARO_S}
        <span className="-rotate-12 text-base leading-none font-black opacity-75 max-[520px]:text-[13px]">
          {calificacion}
        </span>
      </span>
    </li>
  );
}

export default SelloMedalla;
