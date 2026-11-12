import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import contract from './narrativeContract.test.json';
import { NARRATIVE_API_PATH, NARRATIVE_CATALOG_PATHS, NARRATIVE_GAME_PATHS, NARRATIVE_GUEST_CREDENTIAL_PATH } from './narrativeEndpoints';

const operation = (method:string,path:string) => contract.operations.find(x=>x.method===method && x.path===path);
const date = '2026-11-06';
beforeEach(async () => { vi.resetModules();localStorage.clear();sessionStorage.clear();const { setSessionUser } = await import('../../AUTH/sessionStore');setSessionUser({ id: 1, name: 'Cuenta Prueba' });vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>new Response('{}'))); });
afterEach(async () => { const { setSessionUser } = await import('../../AUTH/sessionStore');setSessionUser(null);vi.unstubAllGlobals();vi.unstubAllEnvs();localStorage.clear();sessionStorage.clear(); });

describe('rutas de King’s Court contra OpenAPI', () => {
  it('todas las rutas de partida y catálogos están publicadas con el método esperado', () => {
    const post = new Set(['reiniciar','iniciar','elegirCarta','avanzarMes','avanzarNodo']);
    for (const [name,path] of Object.entries(NARRATIVE_GAME_PATHS)) expect(operation(post.has(name)?'POST':'GET',NARRATIVE_API_PATH+path),name).toBeTruthy();
    for (const path of Object.values(NARRATIVE_CATALOG_PATHS)) expect(operation('GET',NARRATIVE_API_PATH+path),path).toBeTruthy();
    expect(operation('POST',NARRATIVE_GUEST_CREDENTIAL_PATH)).toBeTruthy();
  });

  it('las rutas declaradas por las pestañas del editor existen y no usan catálogos antiguos', () => {
    const directory = resolve(process.cwd(),'admin_src/narrative');
    const normalize = (path:string) => path.replace(/\{[^}]+\}/g,':id');
    const paths = new Set(contract.operations.map(x=>normalize(x.path)));
    for (const file of readdirSync(directory).filter(f=>f.endsWith('.jsx'))) {
      const source=readFileSync(resolve(directory,file),'utf8');
      for (const match of source.matchAll(/['"`](\/api\/narrative\/[^'"`?\s]*)/g)) {
        const path=match[1].replace(/\$\{[^}]+\}/g,':id').replace(/:id$/,m=>match[1].includes('/${')?m:'');
        expect(paths.has(path),file+': '+path).toBe(true);
      }
    }
  });

  it('las consultas del juego envían date en las rutas actuales y conservan cookies', async () => {
    const api=await import('./narrativeService');
    const calls=[
      [api.obtenerSetup,NARRATIVE_GAME_PATHS.setup],
      [api.obtenerEstadoPartida,NARRATIVE_GAME_PATHS.estado],
      [api.obtenerHistorialPartida,NARRATIVE_GAME_PATHS.historial],
      [api.obtenerInventarioPartida,NARRATIVE_GAME_PATHS.inventario],
      [api.obtenerCortePartida,NARRATIVE_GAME_PATHS.corte],
      [api.obtenerFinalizacionPartida,NARRATIVE_GAME_PATHS.finalizacion],
    ] as const;
    for (const [call,path] of calls) {
      await call(date);
      const [input,options]=vi.mocked(fetch).mock.calls.at(-1)!;
      const url=new URL(String(input),'http://app');
      expect(url.pathname).toBe(NARRATIVE_API_PATH+path);
      for(const query of operation('GET',url.pathname)!.requiredQuery) expect(url.searchParams.get(query)).toBe(date);
      expect(options).toMatchObject({ credentials: 'include' });
      expect((options?.headers as Record<string, string>)?.Authorization).toBeUndefined();
    }
  });

  it('iniciar, elegir carta y avanzar mes envían solamente las selecciones del contrato', async () => {
    const api=await import('./narrativeService');
    for(const [call,path,payload] of [
      [()=>api.iniciarPartida(date,['persona'],['carta']),NARRATIVE_GAME_PATHS.iniciar,{date,corte_elegida_ids:['persona'],cartas_iniciales_ids:['carta']}],
      [()=>api.elegirCartaMensual(date,'carta'),NARRATIVE_GAME_PATHS.elegirCarta,{date,carta_id:'carta'}],
      [()=>api.avanzarMes(date),NARRATIVE_GAME_PATHS.avanzarMes,{date}],
      [()=>api.reiniciarPartida(date),NARRATIVE_GAME_PATHS.reiniciar,{date}],
    ] as const) {
      await call();
      const [input,options]=vi.mocked(fetch).mock.calls.at(-1)!;
      expect(new URL(String(input),'http://app').pathname).toBe(NARRATIVE_API_PATH+path);
      expect(options?.method).toBe('POST');
      const body=JSON.parse(String(options?.body));
      expect(body).toEqual(payload);
      for(const field of operation('POST',NARRATIVE_API_PATH+path)!.requiredBody) expect(body).toHaveProperty(field);
    }
  });
});
