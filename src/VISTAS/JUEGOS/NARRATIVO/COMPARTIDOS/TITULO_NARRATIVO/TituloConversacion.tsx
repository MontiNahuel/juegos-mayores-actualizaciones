/* Presenta el título de la conversación con el estilo de la historia. */
import TituloNarrativo from './TituloNarrativo';

// Marco propio de conversaciones; evita mezclarlo con el título de eventos.
export default function TituloConversacion({ titulo, listo = true, permanente = false, onTerminar, onListo, animacionExterna = false }: {
  titulo: string;
  listo?: boolean;
  permanente?: boolean;
  onTerminar?: () => void;
  onListo?: () => void;
  animacionExterna?: boolean;
}) {
  return <TituloNarrativo {...{ titulo, listo, permanente, onTerminar, onListo, animacionExterna }} variante="conversacion" />;
}
