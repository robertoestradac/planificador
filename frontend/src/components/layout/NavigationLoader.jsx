'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * NavigationLoader
 *
 * Muestra una barra de progreso en la parte superior de la pantalla
 * y un overlay semitransparente sobre el contenido al navegar entre páginas.
 * Compatible con Next.js 14 App Router (no usa router events deprecados).
 *
 * Funcionamiento:
 * - usePathname() + useSearchParams() cambian DESPUÉS de que la nueva página cargó
 * - Detectamos el click en links para mostrar el loader ANTES
 * - Cuando el pathname cambia, ocultamos el loader
 */
export default function NavigationLoader() {
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [visible, setVisible]       = useState(false);
  const intervalRef                  = useRef(null);
  const timeoutRef                   = useRef(null);
  const prevPathRef                  = useRef(pathname + searchParams.toString());

  // ── Iniciar animación de progreso ──────────────────────────────
  const startLoader = () => {
    setProgress(0);
    setVisible(true);
    setLoading(true);

    // Simula progreso que se detiene cerca del 85% (espera la respuesta real)
    let p = 0;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      p += Math.random() * 12;
      if (p > 85) { p = 85; clearInterval(intervalRef.current); }
      setProgress(p);
    }, 150);
  };

  // ── Terminar animación al llegar a la nueva página ─────────────
  const finishLoader = () => {
    clearInterval(intervalRef.current);
    setProgress(100);
    // Pequeño delay para que el 100% sea visible antes de ocultar
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setVisible(false), 300); // fade-out
    }, 250);
  };

  // ── Detectar clicks en links antes de la navegación ───────────
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      // Solo links internos que cambien de página
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      // Ignorar si es la misma ruta actual
      const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      if (href === currentPath || href === pathname) return;
      startLoader();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname, searchParams]);

  // ── Terminar loader cuando el pathname cambia (página montada) ─
  useEffect(() => {
    const current = pathname + searchParams.toString();
    if (current !== prevPathRef.current) {
      prevPathRef.current = current;
      finishLoader();
    }
  }, [pathname, searchParams]);

  // ── Cleanup ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Barra de progreso superior */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-violet-100"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        <div
          className="h-full bg-violet-600 rounded-full"
          style={{
            width: `${progress}%`,
            transition: progress === 100
              ? 'width 0.25s ease-out'
              : 'width 0.15s ease-in-out',
            boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
          }}
        />
      </div>

      {/* Spinner centrado sobre el área de contenido */}
      {loading && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 z-[9998] flex items-center justify-center pointer-events-none"
          style={{ paddingLeft: '256px' }}
        >
          <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg border border-gray-100">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
            </div>
            <p className="text-sm font-medium text-gray-500">Cargando...</p>
          </div>
        </div>
      )}
    </>
  );
}
