import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PageHeader({
  title,
  subtitle,
  action,
  backTo,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Explicit destination. If omitted the browser history is used. */
  backTo?: string;
}) {
  const nav = useNavigate();

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start">
        <button
          type="button"
          onClick={() => (backTo ? nav(backTo) : nav(-1))}
          aria-label="Volver"
          className="-ml-2 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800/60 hover:text-zinc-100 active:scale-95"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[26px] font-bold tracking-tight text-zinc-100">{title}</h1>
          {subtitle && <div className="mt-0.5 text-sm text-zinc-400">{subtitle}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
