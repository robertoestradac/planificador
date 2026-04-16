'use client';
import { useRef, useState, useEffect } from 'react';

/**
 * Wraps a section and only renders its children once the element
 * enters (or is near) the viewport. Uses a generous rootMargin
 * so content loads before the user scrolls to it.
 */
export default function LazySection({ children, minHeight = 100 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible ? children : null}
    </div>
  );
}
