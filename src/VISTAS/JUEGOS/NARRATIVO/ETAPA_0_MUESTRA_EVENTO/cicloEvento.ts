const TONOS_POSITIVOS = new Set(['positivo', 'positiva', 'bueno', 'buena', 'soleado', 'soleada']);
const TONOS_NEGATIVOS = new Set(['negativo', 'negativa', 'malo', 'mala', 'tormentoso', 'tormentosa']);

const normalizar = (valor: unknown) => String(valor || '').trim().toLocaleLowerCase('es');

// Resume las cartas del día sin exigir un formato nuevo al backend.
export function calcularTituloCiclo(eventos: any[] = []) {
  const categorias = new Map<string, { nombre: string; cantidad: number }>();
  let positivos = 0;
  let negativos = 0;

  eventos.forEach((evento) => {
    const nombreCategoria = String(evento?.categoria_evento || evento?.categoria || '').trim();
    const categoria = normalizar(nombreCategoria);
    const tono = normalizar(evento?.tono || evento?.polaridad || evento?.tipo_resultado);

    if (tono ? TONOS_POSITIVOS.has(tono) : evento?.es_positivo === true) positivos += 1;
    if (tono ? TONOS_NEGATIVOS.has(tono) : evento?.es_positivo === false || evento?.es_negativo === true) negativos += 1;

    // Bueno/malo describen el clima del ciclo, no su tema.
    if (categoria && !TONOS_POSITIVOS.has(categoria) && !TONOS_NEGATIVOS.has(categoria)) {
      const actual = categorias.get(categoria);
      categorias.set(categoria, { nombre: nombreCategoria, cantidad: (actual?.cantidad || 0) + 1 });
    }
  });

  const ordenadas = [...categorias.values()].sort((a, b) => b.cantidad - a.cantidad);
  if (ordenadas[0] && ordenadas[0].cantidad > (ordenadas[1]?.cantidad || 0)) return `Ciclo de ${ordenadas[0].nombre}`;
  if (positivos > negativos) return 'Ciclo soleado';
  if (negativos > positivos) return 'Ciclo tormentoso';
  if (positivos > 0) return 'Ciclo balanceado';
  return 'Ciclo del Bufón';
}
