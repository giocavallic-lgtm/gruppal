import { } from 'react';
import { useState, useEffect } from 'react';
import { LucidIcon } from 'lucide-react';
import { } from 'date-fns';
import 'date-fns/locale/es';

export default function BirthdayPage() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: number; text: string; delay: number }>>([]);

  // Birthday is November 11th
  const birthday = new Date(new Date().getFullYear(), 10, 11); // month 10 = noviembre
  const now = new Date();
  const daysUntil = Math.max(0, Math.ceil((birthday.getTime() - now.getTime()) / 86400000));

  // Friendly messages to display
  const friendlyMessages = [
    "Gracias por ser una amiga increíble",
    "Aprecio mucho nuestra amistad",
    "Gracias por tu apoyo y tu buen corazón",
    "¡Eres amazing! 🌟",
    "Siempre estás cuando más necesito",
    "Tu energía positiva ilumina el día",
    "Gracias por ser tú mismo",
    "La amistad contigo es un regalo",
  ];

  // Initialize messages with staggered delays
  useEffect(() => {
    const initialized = friendlyMessages.map((text, i) => ({
      id: i,
      text,
      delay: i * 200,
    }));
    setMessages(initialized);
  }, []);

  // Trigger confetti when component mounts or on click
  useEffect(() => {
    const handleClick = () => {
      setShowConfetti(true);
      // Reset after animation
      setTimeout(() => setShowConfetti(false), 2500);
    };

    // Also trigger on double-click
    let clickTimeout: NodeJS.Timeout;
    const onPointerDown = () => {
      clickTimeout = setTimeout(() => {}, 300);
    };
    const onPointerUp = () => {
      clearTimeout(clickTimeout);
      if (/* double click */ true) {
        handleClick();
      }
    };

    // Simple: just click to trigger
    const el = document.querySelector('.birthday-trigger') as HTMLDivElement | null;
    if (el) {
      el.addEventListener('click', handleClick);
    }

    return () => {
      if (el) el.removeEventListener('click', handleClick);
    };
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 text-zinc-100 font-medium overflow-hidden relative">
      {/* Confetti canvas */}
      {showConfetti && (
        <canvas
          id="confetti-canvas"
          className="fixed top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1000 }}
        />
      )}

      {/* Floating decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full opacity-50 animate-float 6000ms ease-in-out infinite"></div>
        <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-purple-500/20 rounded-full opacity-30 animate-float-2 8000ms ease-in-out infinite"></div>
        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-blue-500/20 rounded-full opacity-20 animate-float 6500ms ease-in-out infinite delay-1"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12 px-4">

        {/* Birthday countdown */}
        <div className="mb-8 text-2xl font-semibold text-zinc-400">
          {daysUntil === 0 ? "¡Hoy es tu cumpleaños! 🎉" : `Faltan ${daysUntil} ${daysUntil === 1 ? 'día' : 'días'} para tu cumpleaños`}
        </div>

        {/* Main title */}
        <h1 className="text-5xl md:text-6xl font-bold text-zinc-100 mb-4 tracking-tighter">
          ¡Feliz Cumpleaños! 🎂
        </h1>

        {/* Subtitle - friendly message */}
        <p className="text-2xl text-zinc-400 mb-12 max-w-2xl text-center">
          {messages.length > 0 && messages[0] ? messages[0].text : "Te deseo lo mejor en tu día especial"}
        </p>

        {/* Message grid - appears progressively */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-3xl">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`birthday-trigger group relative p-6 rounded-3xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm transition-all duration-500 hover:translate-y-2 hover:bg-zinc-800/80 ${msg.delay > 0 ? 'fade-in' : ''} ${showConfetti ? 'animate-confetti' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <LucidIcon name="Heart" className="w-5 h-5 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-500 line-clamp-2">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Special message button */}
        <div className="mt-8 w-full max-w-md">
          <button
            className="w-full bg-zinc-800/80 border border-zinc-700/50 rounded-3xl px-8 py-3 text-zinc-100 font-medium text-lg transition-all hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 group/
            data-[state=active]:bg-zinc-700"
            aria-label="Mostrar más mensajes"
          >
            {showConfetti ? "🎉 ¡Ya hicieron confeti!" : "💖 Mostrar mensaje de afecto"}
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-10 text-zinc-500 text-sm">
          Con afecto y amistad 🌹
        </p>
      </div>
    </div>
  );
}