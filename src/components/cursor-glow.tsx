import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let mouseX = -9999;
    let mouseY = -9999;
    let currentX = -9999;
    let currentY = -9999;

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function animate() {
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;

      if (glowRef.current) {
        glowRef.current.style.left = `${currentX}px`;
        glowRef.current.style.top = `${currentY}px`;
      }

      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed -z-10 hidden h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[120px] transition-opacity duration-700 lg:block"
      style={{
        background:
          'radial-gradient(circle, rgba(133,102,255,0.4) 0%, rgba(99,72,254,0.2) 40%, transparent 70%)',
      }}
    />
  );
}
