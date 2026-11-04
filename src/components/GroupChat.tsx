import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Send } from 'lucide-react';
import { useStore } from '../store';

function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Hoy';
  if (sameDay(d, yesterday)) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function GroupChat({ groupId }: { groupId: string }) {
  const allMessages = useStore((s) => s.messages);
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser)!;
  const sendMessage = useStore((s) => s.sendMessage);

  const messages = useMemo(
    () => allMessages.filter((m) => m.groupId === groupId),
    [allMessages, groupId]
  );

  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, groupId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    sendMessage(groupId, body);
    setText('');
  };

  return (
    <div className="card flex flex-col gap-3 p-3">
      <div
        ref={listRef}
        className="flex h-[52dvh] flex-col gap-1.5 overflow-y-auto pe-1"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-zinc-300">Todavía no hay mensajes</p>
            <p className="text-xs text-zinc-500">Escribe el primero para romper el hielo.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const mine = m.userId === currentUser.id;
          const author = users.find((u) => u.id === m.userId);
          const day = dayLabel(m.createdAt);
          const showDay = i === 0 || day !== dayLabel(messages[i - 1].createdAt);
          return (
            <Fragment key={m.id}>
              {showDay && (
                <div className="my-1 flex items-center justify-center">
                  <span className="rounded-full bg-zinc-800/70 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                    {day}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                {!mine && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700/60">
                    {author?.avatar ? (
                      <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
                    ) : (
                      author?.name?.[0] ?? '?'
                    )}
                  </div>
                )}
                <div className={`flex max-w-[78%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {!mine && (
                    <span className="mb-0.5 px-1 text-[10px] font-medium text-zinc-500">
                      {author?.name ?? 'Usuario'}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-snug ${
                      mine
                        ? 'rounded-br-md bg-zinc-200 text-zinc-900'
                        : 'rounded-bl-md bg-zinc-800 text-zinc-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                  <span className="mt-0.5 px-1 text-[10px] tabular-nums text-zinc-600">
                    {timeLabel(m.createdAt)}
                  </span>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          className="input flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          maxLength={2000}
          autoComplete="off"
          aria-label="Nuevo mensaje"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Enviar mensaje"
          className="btn btn-primary h-11 w-11 shrink-0 rounded-full p-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
