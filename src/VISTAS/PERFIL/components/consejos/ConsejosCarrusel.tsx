/* Carrusel de consejos con fuente: avanza solo y se puede recorrer a mano. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { bulbOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import type { ConsejoPerfil } from '../../services/perfilService';
import type { MotivosConsejo } from '../../utils/perfilUtils';

const INTERVALO_MS = 7000;

interface ConsejosCarruselProps {
  consejos: ConsejoPerfil[];
  motivos: MotivosConsejo;
}

export function ConsejosCarrusel({ consejos, motivos }: ConsejosCarruselProps) {
  const [activo, setActivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const inicioArrastre = useRef<number | null>(null);

  const ir = useCallback(
    (indice: number) => setActivo((indice + consejos.length) % consejos.length),
    [consejos.length],
  );

  useEffect(() => {
    if (consejos.length < 2 || pausado) return;
    const reducido =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido) return;
    const temporizador = window.setInterval(
      () => setActivo((indice) => (indice + 1) % consejos.length),
      INTERVALO_MS,
    );
    return () => window.clearInterval(temporizador);
  }, [consejos.length, pausado]);

  if (consejos.length === 0) return null;

  const unico = consejos.length === 1;

  return (
    <section
      aria-label="Por qué estos juegos"
      aria-roledescription="carrusel"
      className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#4b5d73] bg-[linear-gradient(90deg,rgba(237,212,153,.07),transparent_42%),#263548] px-[18px] py-4 max-[640px]:gap-2.5 max-[640px]:p-3.5"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex size-8 items-center justify-center rounded-[9px] bg-[#edd499]/12 text-[#edd499]"
          aria-hidden="true"
        >
          <IonIcon icon={bulbOutline} className="text-[17px]" />
        </span>
        <p className="m-0 text-[11px] font-extrabold tracking-[.1em] text-[#edd499] uppercase">
          Sabías que…
        </p>
      </div>

      <div
        className="overflow-hidden"
        onPointerDown={(evento) => {
          inicioArrastre.current = evento.clientX;
        }}
        onPointerUp={(evento) => {
          if (inicioArrastre.current === null) return;
          const desplazamiento = evento.clientX - inicioArrastre.current;
          inicioArrastre.current = null;
          if (!unico && Math.abs(desplazamiento) >= 40) {
            ir(activo + (desplazamiento < 0 ? 1 : -1));
          }
        }}
      >
        <ul
          className="m-0 flex list-none p-0 transition-transform duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${activo * 100}%)` }}
        >
          {consejos.map((consejo, indice) => {
            const motivo = consejo.situacion ? motivos[consejo.situacion] : undefined;
            return (
              <li
                key={consejo.id}
                className="w-full min-w-0 shrink-0"
                aria-hidden={indice !== activo}
                inert={indice !== activo}
              >
                {motivo && (
                  <p className="m-0 mb-[7px] text-[13.5px] leading-[1.35] font-bold text-[#e5cf9a] max-[640px]:text-[13px]">
                    {motivo}
                  </p>
                )}
                <p className="m-0 text-[14.5px] leading-[1.45] text-menu-ink max-[640px]:text-[13.5px] max-[640px]:leading-[1.4]">
                  {consejo.texto}
                </p>
                <p className="mt-[7px] mb-0 text-[11.5px] text-menu-copy max-[640px]:mt-1.5 max-[640px]:text-[11px]">
                  Fuente: {consejo.fuente}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {!unico && (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label="Consejo anterior"
            onClick={() => ir(activo - 1)}
            className="flex size-7 cursor-pointer items-center justify-center bg-transparent p-0 text-menu-copy transition-colors hover:text-menu-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8bd9cc]"
          >
            <IonIcon icon={chevronBackOutline} className="text-lg" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Consejo siguiente"
            onClick={() => ir(activo + 1)}
            className="flex size-7 cursor-pointer items-center justify-center bg-transparent p-0 text-menu-copy transition-colors hover:text-menu-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8bd9cc]"
          >
            <IonIcon icon={chevronForwardOutline} className="text-lg" aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}

export default ConsejosCarrusel;
