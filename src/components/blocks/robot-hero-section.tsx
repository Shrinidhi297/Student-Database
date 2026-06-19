import { InteractiveRobotSpline } from './interactive-3d-robot';

const ROBOT_SCENE_URL = 'https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode';

export function RobotHeroSection() {
  return (
    <div className="relative w-full h-[40rem] md:h-[50rem] overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02]">
      <InteractiveRobotSpline
        scene={ROBOT_SCENE_URL}
        className="absolute inset-0 z-0"
      />
      <div className="absolute inset-0 z-10 flex items-end justify-center pb-8 pointer-events-none">
        <div className="text-center text-white drop-shadow-lg w-full max-w-2xl mx-auto px-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-medium">
            Interactive 3D
          </p>
          <h2 className="text-xl md:text-2xl font-bold mt-1 text-white/70">
            Cursor-tracking robot
          </h2>
        </div>
      </div>
    </div>
  );
}
