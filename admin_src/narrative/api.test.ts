import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fetchNarrativeAdmin } from './api';

beforeEach(()=>{localStorage.clear();sessionStorage.clear();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('[]')));});
afterEach(()=>{localStorage.clear();sessionStorage.clear();vi.unstubAllGlobals();});

it('el editor usa la identidad del operador y cookies sin perder headers propios',async()=>{
  localStorage.setItem('asistodo_operador_session',JSON.stringify({token:'operador',tipoUsuario:2}));
  await fetchNarrativeAdmin('/api/narrative/admin/cartas',{headers:{'Content-Type':'application/json'}});
  const [url,options]=vi.mocked(fetch).mock.calls[0];
  expect(url).toContain('/api/narrative/admin/cartas');
  expect(options?.credentials).toBe('same-origin');
  expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer operador');
  expect(new Headers(options?.headers).get('Content-Type')).toBe('application/json');
});

it('no fuerza JSON sobre el multipart de subida de imágenes',async()=>{
  const body=new FormData();body.append('file',new Blob(['imagen'],{type:'image/webp'}),'imagen.webp');
  await fetchNarrativeAdmin('/api/narrative/admin/upload-imagen?categoria=cartas',{method:'POST',body});
  const options=vi.mocked(fetch).mock.calls[0][1];
  expect(options?.body).toBe(body);
  expect(new Headers(options?.headers).has('Content-Type')).toBe(false);
});
