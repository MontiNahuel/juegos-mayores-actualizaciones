/* Da una base común a las ventanas emergentes y al manejo del cierre. */
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}

// Da una base común a las ventanas emergentes y al manejo del cierre.
export function ModalBase({ isOpen, onClose, labelledBy, children }: ModalBaseProps) {
  const panel = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onClose);
  cerrar.current = onClose;

  useEffect(/* Sincroniza este efecto cuando cambian los datos de los que depende. */ () => {
    if (!isOpen) return;
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    // Cierra la ventana cuando se presiona Escape.
    const teclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cerrar.current();
      }
      if (event.key !== 'Tab') return;
      const elementos = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || [])];
      const primero = elementos[0];
      const ultimo = elementos.at(-1);
      if (!primero) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === primero || document.activeElement === panel.current)) {
        event.preventDefault(); ultimo?.focus();
      } else if (!event.shiftKey && (document.activeElement === ultimo || document.activeElement === panel.current)) {
        event.preventDefault(); primero.focus();
      }
    };
    document.addEventListener('keydown', teclado, true);
    return /* Libera los recursos de este efecto cuando deja de usarse. */ () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', teclado, true);
      if (anterior instanceof HTMLElement && anterior.isConnected) anterior.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000] grid place-items-center overflow-y-auto bg-slate-900/65 px-3 pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-6"
      onClick={/* Responde a click desde este control. */ event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}
        onKeyDown={/* Responde a key down desde este control. */ event => event.stopPropagation()}
        className="motion-safe:animate-modal-down max-h-[calc(100dvh-max(12px,env(safe-area-inset-top))-max(12px,env(safe-area-inset-bottom)))] w-full min-w-0 max-w-[480px] overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-4 text-center text-slate-900 shadow-2xl outline-none sm:p-6">
        {children}
      </div>
    </div>, document.body,
  );
}
