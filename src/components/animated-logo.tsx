import { Sparkles } from 'lucide-react';

export function AnimatedLogo() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-purple-500/20 to-indigo-500/30 blur-xl animate-pulse-glow" />

      {/* 3D cube container */}
      <div className="preserve-3d h-16 w-16 animate-rotate-3d sm:h-20 sm:w-20">
        {/* Front face */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-primary/25 to-purple-600/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
          style={{ transform: 'translateZ(20px)' }}
        >
          <Sparkles className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-purple-600/20 to-indigo-600/15 backdrop-blur-xl"
          style={{ transform: 'rotateY(180deg) translateZ(20px)' }}
        >
          <Sparkles className="h-7 w-7 text-purple-400 sm:h-8 sm:w-8" />
        </div>

        {/* Top face */}
        <div
          className="absolute inset-0 rounded-2xl border border-white/8 bg-gradient-to-br from-primary/15 to-purple-500/10 backdrop-blur-xl"
          style={{ transform: 'rotateX(90deg) translateZ(20px)' }}
        />

        {/* Bottom face */}
        <div
          className="absolute inset-0 rounded-2xl border border-white/8 bg-gradient-to-br from-indigo-500/15 to-purple-500/10 backdrop-blur-xl"
          style={{ transform: 'rotateX(-90deg) translateZ(20px)' }}
        />

        {/* Left face */}
        <div
          className="absolute inset-0 rounded-2xl border border-white/8 bg-gradient-to-br from-primary/10 to-indigo-500/10 backdrop-blur-xl"
          style={{ transform: 'rotateY(-90deg) translateZ(20px)' }}
        />

        {/* Right face */}
        <div
          className="absolute inset-0 rounded-2xl border border-white/8 bg-gradient-to-br from-purple-500/10 to-primary/15 backdrop-blur-xl"
          style={{ transform: 'rotateY(90deg) translateZ(20px)' }}
        />
      </div>

      {/* Orbiting sparkle particles */}
      <div className="absolute -inset-4 animate-spin-slow">
        <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary/60 blur-[1px]" />
        <div className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-purple-400/40 blur-[1px]" />
        <div className="absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-indigo-400/50 blur-[1px]" />
        <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary/50 blur-[1px]" />
      </div>

      {/* Orbiting particles (second ring) */}
      <div className="absolute -inset-6 animate-spin-slow-reverse">
        <div
          className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-purple-300/30 blur-[1px]"
          style={{ animationDelay: '-1s' }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary/40 blur-[1px]"
          style={{ animationDelay: '-2s' }}
        />
      </div>
    </div>
  );
}

export function AnimatedLogoSmall() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md animate-pulse-glow" />
      <div className="preserve-3d h-8 w-8 animate-rotate-3d">
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg border border-white/20 bg-gradient-to-br from-primary/30 to-purple-600/20 backdrop-blur-xl"
          style={{ transform: 'translateZ(10px)' }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div
          className="absolute inset-0 rounded-lg border border-white/10 bg-gradient-to-br from-purple-600/20 to-indigo-600/15 backdrop-blur-xl"
          style={{ transform: 'rotateY(180deg) translateZ(10px)' }}
        >
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
      </div>
    </div>
  );
}
