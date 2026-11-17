/* Mensaje contextual del progreso con los tramos enfatizados. */
import type { TramoMensaje } from '../../utils/perfilUtils';

interface TextoMensajeProps {
  partes: TramoMensaje[];
}

export function TextoMensaje({ partes }: TextoMensajeProps) {
  return (
    <p className="m-0 text-[11.5px] leading-4 text-menu-copy">
      {partes.map((parte, indice) =>
        parte.fuerte ? (
          <b key={indice} className="font-extrabold text-menu-ink">
            {parte.texto}
          </b>
        ) : (
          <span key={indice}>{parte.texto}</span>
        ),
      )}
    </p>
  );
}
