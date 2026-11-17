/* Brillos de las tarjetas: posición y ritmo propios para que no caigan en bloque. */
import { useMemo, type CSSProperties } from 'react';

export function Particulas() {
  const brillos = useMemo(
    () =>
      Array.from({ length: 12 }, () => ({
        '--x': `${4 + Math.random() * 92}%`,
        '--size': `${2.5 + Math.random() * 3}px`,
        '--dur': `${750 + Math.random() * 550}ms`,
        '--delay': `${Math.random() * 550}ms`,
      })),
    [],
  );

  return (
    <span className="planes-sparks" aria-hidden="true">
      {brillos.map((estilo, indice) => (
        <span key={indice} className="planes-spark" style={estilo as CSSProperties} />
      ))}
    </span>
  );
}
