import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../store';

/** Small floating toggle for screens shown before the user reaches Settings. */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const setTheme = useStore((s) => s.setTheme);
  const [light, setLight] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setLight(root.dataset.theme === 'light');
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={() => setTheme(light ? 'dark' : 'light')}
      aria-label={light ? 'Activar modo oscuro' : 'Activar modo claro'}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800/80 bg-zinc-900/60 text-zinc-300 backdrop-blur transition hover:text-zinc-100 active:scale-95 ${className}`}
    >
      {light ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
