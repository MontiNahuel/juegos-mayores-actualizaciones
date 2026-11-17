/* Tabs Evolución/Práctica y rango que abarca la vista activa. */
export type VistaProgreso = 'linea' | 'radar';

const BOTON_VISTA =
  'cursor-pointer border-b-2 pb-1 font-[inherit] text-[11px] font-extrabold tracking-[.07em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8bd9cc]';

const VISTAS: { valor: VistaProgreso; etiqueta: string; rango: string }[] = [
  { valor: 'linea', etiqueta: 'Evolución', rango: 'Últimos 6 meses' },
  { valor: 'radar', etiqueta: 'Práctica', rango: 'Este año' },
];

interface ProgresoTabsProps {
  vista: VistaProgreso;
  onCambiar: (vista: VistaProgreso) => void;
}

export function ProgresoTabs({ vista, onCambiar }: ProgresoTabsProps) {
  const activa = VISTAS.find((opcion) => opcion.valor === vista) ?? VISTAS[0];

  return (
    <div className="mt-0 mb-2.5 flex items-baseline justify-between gap-3">
      <div className="flex items-baseline gap-4" role="group" aria-label="Vista del progreso">
        {VISTAS.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => onCambiar(opcion.valor)}
            aria-pressed={vista === opcion.valor}
            className={`${BOTON_VISTA} ${
              vista === opcion.valor
                ? 'border-[#8bd9cc] text-menu-ink'
                : 'border-transparent text-menu-copy hover:text-menu-ink'
            }`}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>
      <span className="text-[11.5px] font-semibold text-menu-copy whitespace-nowrap">
        {activa.rango}
      </span>
    </div>
  );
}
