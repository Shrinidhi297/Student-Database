import { useEffect, useRef, useState, type ReactNode } from 'react';

export function ScrollReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${visible ? 'animate-zoom-in' : 'scale-[0.85] opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}
