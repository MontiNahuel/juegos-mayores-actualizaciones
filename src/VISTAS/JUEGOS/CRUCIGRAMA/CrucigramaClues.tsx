import { cleanClueText, type WordDef } from './crucigramaTypes';

interface CrucigramaCluesProps {
  words: WordDef[];
  activeWordId?: string;
  isComplete: (word: WordDef) => boolean;
  onSelect: (word: WordDef) => void;
}

// La misma lista se usa en el panel de escritorio y en el desplegable móvil.
export function CrucigramaClues({ words, activeWordId, isComplete, onSelect }: CrucigramaCluesProps) {
  return <div className="space-y-6">
    {(['horizontal', 'vertical'] as const).map(direction => <section key={direction}>
      <h3 className="m-0 mb-3 text-base font-extrabold text-[#294C6B]">{direction === 'horizontal' ? 'Horizontales' : 'Verticales'}</h3>
      <ul className="m-0 list-none space-y-2 p-0">
        {words.filter(word => word.direction === direction).map(word => {
          const selected = word.id === activeWordId;
          const complete = isComplete(word);
          return <li key={word.id}>
            <button type="button" onClick={() => onSelect(word)} aria-pressed={selected}
              className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm leading-relaxed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#53BFC9] min-[900px]:text-base ${selected ? 'border-[#CA8A04] bg-[#FEF9C3]' : 'border-[#DEE3EA] bg-[#F8FAFC] hover:bg-[#EDF2F7]'}`}>
              <span className="shrink-0 font-extrabold text-[#294C6B]">{word.number}.</span>
              <span className={`min-w-0 flex-1 ${complete ? 'text-[#047857]' : 'text-[#1E293B]'}`}>
                {cleanClueText(word.clue)}
                <span className="ml-1 text-xs whitespace-nowrap text-[#64748B]">({word.length} letras)</span>
              </span>
              {complete && <span className="font-bold text-[#047857]" aria-label="Resuelta">✓</span>}
            </button>
          </li>;
        })}
      </ul>
    </section>)}
  </div>;
}
