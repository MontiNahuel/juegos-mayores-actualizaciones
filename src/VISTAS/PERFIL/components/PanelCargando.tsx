/* Esqueleto mientras llega el resumen del perfil. */
import { PANEL } from './paneles';

export function PanelCargando() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-5 max-md:grid-cols-1" aria-hidden="true">
      {[0, 1, 2, 3].map((indice) => (
        <div key={indice} className={`${PANEL} animate-pulse`}>
          <div className="h-5 w-40 rounded bg-[#3d4f65]" />
          <div className="mt-4 h-14 rounded-xl bg-[#34465b]" />
          <div className="mt-4 h-3 w-3/4 rounded bg-[#34465b]" />
        </div>
      ))}
    </div>
  );
}

export default PanelCargando;
