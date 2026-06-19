import { useEffect, useRef, type ReactNode } from 'react';

export function FinisherHeaderEffect({ children, className = '' }: { children: ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    function init() {
      if (typeof window.FinisherHeader !== 'undefined' && containerRef.current) {
        initializedRef.current = true;
        new window.FinisherHeader({
          count: 90,
          size: { min: 1, max: 20, pulse: 0 },
          speed: { x: { min: 0, max: 0.4 }, y: { min: 0, max: 0.1 } },
          colors: {
            background: '#000000',
            particles: ['#ffffff', '#87ddfe', '#acaaff', '#1bffc2', '#faf8fa'],
          },
          blending: 'screen',
          opacity: { center: 0, edge: 0.4 },
          skew: 1.2,
          shapes: ['c', 's'],
        });
      } else {
        setTimeout(init, 100);
      }
    }

    init();

    return () => {
      initializedRef.current = false;
    };
  }, []);

  return (
    <div ref={containerRef} className={`finisher-header relative ${className}`}>
      {children}
    </div>
  );
}
