import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="fade-in absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="sheet-up relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] border border-zinc-800/80 bg-zinc-900/95 p-5 pb-[calc(1.25rem+var(--safe-bottom))] shadow-2xl backdrop-blur-xl sm:max-w-lg sm:rounded-[28px] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-zinc-700 sm:hidden" />
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h3 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h3> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition hover:text-zinc-100 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
