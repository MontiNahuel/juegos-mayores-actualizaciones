/* Pide pistas al servidor y comunica el resultado de la compra. */
import { API_URL } from '../config/api';

export interface SolicitudPista {
  game_id: 'wordle' | 'sudoku' | 'sopa_letras' | 'crucigrama';
  date?: string;
  hint_index?: number;
  row?: number;
  col?: number;
}

export interface RespuestaPista {
  success: true;
  puntos_restantes: number;
  puntos_descontados?: number;
  pista: string | null;
  valor_revelado: string | number | null;
  message?: string;
}

export class ErrorPista extends Error {
  // Completa este paso con los datos recibidos por la operación.
  constructor(public status: number, mensaje: string) { super(mensaje); }
}

// Solicita una pista al servidor y devuelve el saldo de puntos confirmado.
export async function pedirPistaConPuntos(solicitud: SolicitudPista): Promise<RespuestaPista> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) throw new ErrorPista(401, 'Iniciá sesión para comprar una pista.');
  const respuesta = await fetch(`${API_URL}/api/economy/use-hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(solicitud),
  });
  const datos = await respuesta.json().catch(/* Maneja el fallo de esta operación. */ () => null);
  if (!respuesta.ok) throw new ErrorPista(respuesta.status, datos?.detail || 'No se pudo solicitar la pista.');
  if (!datos?.success || !Number.isFinite(datos.puntos_restantes)) {
    throw new Error('No se pudo confirmar la compra de la pista.');
  }
  return datos;
}
