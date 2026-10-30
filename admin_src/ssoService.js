/* Intercambia tickets para pasar entre sistemas con la misma sesión. */
import { OPERADOR_STORAGE_KEY } from './LoginSistemas';

/**
 * Canjea un ticket descartable de SSO emitido por el Autenticador Central
 * y guarda la sesión administrativa localmente en el navegador.
 */
export async function canjearTicketSSO(ticket) {
  if (!ticket || typeof ticket !== 'string') {
    throw new Error('Ticket no proporcionado o inválido.');
  }

  const response = await fetch('/api/auth/sso/canjear-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket: ticket.trim() }),
  });

  const data = await response.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));

  if (!response.ok || !data.success || !data.token) {
    const errorMsg = data.detail || data.message || 'Error al canjear el ticket de acceso SSO.';
    throw new Error(errorMsg);
  }

  const sessionData = {
    user: data.user?.name || data.user?.email || 'Administrador',
    email: data.user?.email || '',
    token: data.token,
    tipoUsuario: 2,
    timestamp: Date.now(),
  };

  localStorage.setItem(OPERADOR_STORAGE_KEY, JSON.stringify(sessionData));
  return sessionData;
}

/**
 * Solicita un ticket efímero de retorno al Autenticador
 * para saltar de regreso al panel central de usuarios.
 */
export async function solicitarTicketRetorno(servicioDestino = 'autenticador') {
  const sesionRaw = localStorage.getItem(OPERADOR_STORAGE_KEY);
  if (!sesionRaw) throw new Error('No hay sesión activa para solicitar retorno.');

  const sesion = JSON.parse(sesionRaw);
  const token = sesion.token;

  const response = await fetch('/api/auth/sso/crear-ticket-retorno', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ servicioDestino }),
  });

  const data = await response.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));

  if (!response.ok || !data.success || !data.ticket) {
    const errorMsg = data.detail || data.message || 'Error al generar ticket de retorno.';
    throw new Error(errorMsg);
  }

  return data;
}
