/* Prepara las aserciones accesibles y el almacenamiento aislado de las pruebas. */
import '@testing-library/jest-dom';

function crearStorage(): Storage {
  const valores = new Map<string, string>();
  return {
    get length() { return valores.size; },
    clear: () => valores.clear(),
    getItem: clave => valores.get(clave) ?? null,
    key: indice => [...valores.keys()][indice] ?? null,
    removeItem: clave => { valores.delete(clave); },
    setItem: (clave, valor) => { valores.set(clave, String(valor)); },
  };
}

// Node 26 expone getters globales de storage sin archivo; se usan almacenes aislados.
const local = crearStorage();
const session = crearStorage();
for (const target of [globalThis, window]) {
  Object.defineProperty(target, 'localStorage', { configurable: true, value: local });
  Object.defineProperty(target, 'sessionStorage', { configurable: true, value: session });
}
