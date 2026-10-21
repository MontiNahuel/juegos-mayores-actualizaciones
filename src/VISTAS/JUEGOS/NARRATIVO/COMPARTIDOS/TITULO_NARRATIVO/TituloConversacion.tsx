import TituloNarrativo from './TituloNarrativo';

// Marco propio de conversaciones; evita mezclarlo con el título de eventos.
export default function TituloConversacion({ titulo, listo = true, permanente = false, onTerminar }: {
  titulo: string;
  listo?: boolean;
  permanente?: boolean;
  onTerminar?: () => void;
}) {
  return <TituloNarrativo {...{ titulo, listo, permanente, onTerminar }} variante="conversacion" />;
}
