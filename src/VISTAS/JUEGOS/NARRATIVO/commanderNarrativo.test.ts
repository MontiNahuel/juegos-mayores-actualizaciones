import { expect, it, vi } from 'vitest';
import { presentarResolucion } from './commanderNarrativo';
import type { EstadoPartida } from './narrativeService';

const puertos = () => ({ sincronizar: vi.fn(), finalizar: vi.fn(), resultado: vi.fn(),
  conversar: vi.fn(), evento: vi.fn(async () => {}), draft: vi.fn(async () => {}) });

it('una finalización prevalece sobre un evento pendiente en la misma respuesta', async () => {
  const vista = puertos();
  const estado = { finalizacion: { _id: 'fin' }, evento_actual: { id: 'evento' } } as EstadoPartida;
  await presentarResolucion(estado, vista);
  expect(vista.finalizar).toHaveBeenCalledWith(estado.finalizacion);
  expect(vista.evento).not.toHaveBeenCalled();
  expect(vista.sincronizar.mock.invocationCallOrder[0]).toBeLessThan(vista.finalizar.mock.invocationCallOrder[0]);
});

it('sincroniza antes de ejecutar un draft que puede pedir otro nodo', async () => {
  const vista = puertos();
  await presentarResolucion({ fase_actual: 'DRAFT_MENSUAL', cartas_draft_actual: [{ _id: 'carta' }] } as EstadoPartida, vista);
  expect(vista.draft).toHaveBeenCalledOnce();
  expect(vista.sincronizar.mock.invocationCallOrder[0]).toBeLessThan(vista.draft.mock.invocationCallOrder[0]);
});
