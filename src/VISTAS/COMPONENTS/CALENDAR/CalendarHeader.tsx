/* Muestra el mes y los botones para pasar al anterior o al siguiente. */
import LoginHeader from '../../LOGIN/LoginHeader';

interface CalendarHeaderProps {
  title: string;
  onBack: () => void;
  primaryColor?: string;
}

// El calendario comparte identidad, sesión y acciones con el menú.
export function CalendarHeader({ title, onBack, primaryColor }: CalendarHeaderProps) {
  return <LoginHeader title={title} onBack={onBack} primaryColor={primaryColor} ocultarSaludoEnMovil ocultarSesion />;
}
