export interface CardData {
  id: string;
  nombre: string;
  descripcion: string;
  imagen?: string;
  categoria?: string;
}

export type PersonajeCard = CardData;

interface CardProps {
  personaje: CardData;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

const Card = ({ personaje, selected, disabled, onSelect }: CardProps) => (
  <button
    aria-pressed={selected}
    className={`rounded border p-4 text-left ${selected ? 'border-green-600 bg-green-50' : 'border-slate-300 bg-white'} ${disabled ? 'opacity-50' : ''}`}
    disabled={disabled}
    onClick={onSelect}
    type="button"
  >
    {personaje.imagen && <img alt={personaje.nombre} className="mb-3 h-32 w-full object-cover" src={personaje.imagen} />}
    {personaje.categoria && <p className="text-sm text-slate-500">{personaje.categoria}</p>}
    <h3 className="font-bold">{personaje.nombre}</h3>
    <p className="mt-1 text-sm text-slate-600">{personaje.descripcion}</p>
  </button>
);

export default Card;
