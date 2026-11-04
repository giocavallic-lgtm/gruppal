import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Send, Reply, X } from 'lucide-react';
import { useStore } from '../store';
import type { Message } from '../types';

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
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, groupId]);

  const nameOf = (userId: string) => users.find((u) => u.id === userId)?.name ?? 'Usuario';

  const startReply = (m: Message) => {
    setReplyTo(m);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    sendMessage(groupId, body, replyTo?.id);
    setText('');
    setReplyTo(null);
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
          const quoted = m.replyToId ? messages.find((x) => x.id === m.replyToId) : undefined;
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
                    {m.replyToId && (
                      <div
                        className={`mb-1.5 rounded-lg border-s-2 px-2 py-1 text-[11px] ${
                          mine
                            ? 'border-zinc-500/60 bg-zinc-900/10 text-zinc-700'
                            : 'border-zinc-500/60 bg-white/5 text-zinc-300'
                        }`}
                      >
                        <p className="font-semibold">
                          {quoted ? nameOf(quoted.userId) : 'Mensaje'}
                        </p>
                        <p className="line-clamp-2 break-words opacity-80">
                          {quoted ? quoted.body : 'Mensaje no disponible'}
                        </p>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                  <div className={`mt-0.5 flex items-center gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
                    <span className="px-1 text-[10px] tabular-nums text-zinc-600">
                      {timeLabel(m.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => startReply(m)}
                      aria-label={`Responder a ${author?.name ?? 'este mensaje'}`}
                      className="rounded-full p-0.5 text-zinc-600 opacity-70 transition hover:bg-zinc-800 hover:text-zinc-300 hover:opacity-100 active:scale-90"
                    >
                      <Reply size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      {replyTo && (
        <div className="flex items-center gap-2 rounded-xl border-s-2 border-zinc-500 bg-zinc-800/60 px-2.5 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-zinc-300">
              Respondiendo a {nameOf(replyTo.userId)}
            </p>
            <p className="truncate text-[11px] text-zinc-500">{replyTo.body}</p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            aria-label="Cancelar respuesta"
            className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          ref={inputRef}
          className="input flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyTo ? `Responder a ${nameOf(replyTo.userId)}…` : 'Escribe un mensaje…'}
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
