// Renderiza una carta elegible durante las etapas 0 y 1.
// ETAPA 0 y 1: representa una carta que el jugador puede elegir.
const CartaSeleccionableEtapa0y1 = ({ carta, selected, disabled, onSelect }: any) => (
  <button
    aria-pressed={selected}
    className={`rounded border p-4 text-left ${selected ? 'border-green-600 bg-green-50' : 'border-slate-300 bg-white'} ${disabled ? 'opacity-50' : ''}`}
    disabled={disabled}
    onClick={onSelect}
    type="button"
  >
    {carta.imagen && <img alt={carta.nombre} className="mb-3 h-32 w-full object-cover" src={carta.imagen} />}
    {carta.categoria && <p className="text-sm text-slate-500">{carta.categoria}</p>}
    <h3 className="font-bold">{carta.nombre}</h3>
    <p className="mt-1 text-sm text-slate-600">{carta.descripcion}</p>
  </button>
);

export default CartaSeleccionableEtapa0y1;
