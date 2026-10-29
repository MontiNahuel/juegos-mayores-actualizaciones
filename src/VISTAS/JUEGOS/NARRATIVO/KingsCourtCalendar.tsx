/* Abre la historia desde su calendario de desafíos. */
// Muestra el calendario de desafios diarios de Kings Court.
import { DailyChallengeCalendar } from '../../COMPONENTS/CALENDAR';

// Abre la historia desde su calendario de desafíos.
export default function KingsCourtCalendar() {
  return (
    <DailyChallengeCalendar
      gameId="narrativo"
      title="King's Court"
      heroBadge="Desafío narrativo"
      heroSubtitle="Tomá decisiones para guiar a tu corte durante el desafío del día."
      playRoute="/juegos/kings-court/jugar"
    />
  );
}
