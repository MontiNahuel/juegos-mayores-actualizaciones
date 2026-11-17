/* Radar de práctica: medallas del año por eje cognitivo, con escala común. */
import { puntosRadar, type PracticaAnual } from '../../utils/perfilUtils';

const ANILLOS_RADAR = [
  '160,26 214,80 160,134 106,80',
  '160,44 196,80 160,116 124,80',
  '160,62 178,80 160,98 142,80',
];

const POSICIONES_RADAR = [
  {
    etiqueta: { x: 160, y: 16, anchor: 'middle' as const },
    valor: { x: 160, y: 31, anchor: 'middle' as const },
  },
  {
    etiqueta: { x: 214, y: 77, anchor: 'start' as const },
    valor: { x: 214, y: 92, anchor: 'start' as const },
  },
  {
    etiqueta: { x: 160, y: 150, anchor: 'middle' as const },
    valor: { x: 160, y: 136, anchor: 'middle' as const },
  },
  {
    etiqueta: { x: 106, y: 77, anchor: 'end' as const },
    valor: { x: 106, y: 92, anchor: 'end' as const },
  },
];

interface RadarPracticaProps {
  practica: PracticaAnual;
}

export function RadarPractica({ practica }: RadarPracticaProps) {
  const puntos = puntosRadar(practica.ejes);
  const rombo = puntos.map((punto) => `${punto.x},${punto.y}`).join(' ');
  const detalle = practica.ejes
    .map((eje) => `${eje.etiqueta} ${eje.total}`)
    .join(', ');
  const hayCero = practica.ejes.some((eje) => eje.total === 0);
  const ejesConMedalla = practica.ejes.filter((eje) => eje.total > 0).length;

  return (
    <div
      role="img"
      aria-label={`Práctica del año: ${detalle}.`}
      className="flex h-full items-center justify-center"
    >
      <svg
        viewBox="0 0 320 160"
        className="h-40 w-auto max-w-full overflow-visible"
        aria-hidden="true"
      >
        {ANILLOS_RADAR.map((anillo) => (
          <polygon key={anillo} points={anillo} className="fill-none stroke-[#41536a]" />
        ))}
        <line x1="160" y1="80" x2="160" y2="26" className="stroke-[#41536a]" />
        <line x1="160" y1="80" x2="214" y2="80" className="stroke-[#41536a]" />
        <line x1="160" y1="80" x2="160" y2="134" className="stroke-[#41536a]" />
        <line x1="160" y1="80" x2="106" y2="80" className="stroke-[#41536a]" />

        {ejesConMedalla >= 2 && (
          <polygon
            points={rombo}
            className="fill-[#8bd9cc]/16 stroke-[#8bd9cc]"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {practica.ejes.map((eje, indice) =>
          eje.total > 0 ? (
            <circle
              key={eje.juego}
              cx={puntos[indice].x}
              cy={puntos[indice].y}
              r="4"
              className="fill-[#8bd9cc] stroke-menu-panel"
              strokeWidth="2"
            />
          ) : null,
        )}
        {hayCero && (
          <circle cx="160" cy="80" r="3" opacity=".45" className="fill-[#8bd9cc]" />
        )}

        {practica.ejes.map((eje, indice) => {
          const posicion = POSICIONES_RADAR[indice];
          return (
            <g key={`etiqueta-${eje.juego}`}>
              <text
                x={posicion.etiqueta.x}
                y={posicion.etiqueta.y}
                textAnchor={posicion.etiqueta.anchor}
                className="fill-menu-copy text-[11px] font-bold"
              >
                {eje.etiqueta}
              </text>
              <text
                x={posicion.valor.x}
                y={posicion.valor.y}
                textAnchor={posicion.valor.anchor}
                className="fill-menu-ink text-[11px] font-black"
              >
                {eje.total}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
