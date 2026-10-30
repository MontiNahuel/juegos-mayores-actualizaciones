import type { ClassicResult } from '../../JUEGOS/classicScoring';

export function ClassicResultSummary({ result, saving, error, onRetry }: {
  result: ClassicResult; saving?: boolean; error?: string; onRetry?: () => Promise<void>;
}) {
  const stars = Math.max(0, Math.min(3, Math.floor(result.stars)));
  return <section aria-label="Resultado del desafío" className="space-y-2 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-teal-900">
    <p className="m-0 text-sm font-bold">Tu categoría</p>
    <p className="m-0 text-5xl font-black">{result.grade}</p>
    <p className="m-0 font-extrabold">{result.score} puntos</p>
    <div aria-label={`${stars} de 3 estrellas`} className="text-2xl text-amber-500">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
    {result.awardedPoints !== undefined && !saving && <p className="m-0 text-sm">{result.awardedPoints > 0 ? `Se acreditaron ${result.awardedPoints} puntos a tu cuenta.` : 'No se acreditaron puntos nuevos.'}</p>}
    {saving && <p role="status" className="m-0 text-sm">Confirmando resultado y puntos…</p>}
    {error && <div role="alert" className="text-sm text-rose-800"><p>{error}</p><button type="button" disabled={saving} onClick={onRetry} className="min-h-11 rounded-xl border border-rose-300 px-4 font-bold">Reintentar guardado</button></div>}
  </section>;
}
