import React from 'react';

interface AnimatedWaveBackgroundProps {
  intensity?: 'subtle' | 'normal' | 'intense';
  className?: string;
}

export const AnimatedWaveBackground: React.FC<AnimatedWaveBackgroundProps> = ({
  intensity = 'normal',
  className = '',
}) => {
  const opacityMultiplier = intensity === 'subtle' ? 0.6 : intensity === 'intense' ? 1.2 : 0.9;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden z-0 select-none bg-[#FFF9F2] ${className}`}
      style={{ opacity: opacityMultiplier }}
    >
      {/* Soft Pastel Ambient Floating Glows */}
      <div
        className="absolute top-[-10%] left-[10%] w-[550px] h-[550px] rounded-full bg-[#EAE5FF]/70 blur-[130px] pointer-events-none pastel-glow-1"
      />
      <div
        className="absolute top-[25%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#FFE0D2]/60 blur-[130px] pointer-events-none pastel-glow-2"
        style={{ animationDelay: '3s' }}
      />
      <div
        className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#CFF5E7]/50 blur-[140px] pointer-events-none pastel-glow-1"
        style={{ animationDelay: '6s' }}
      />
      <div
        className="absolute top-[50%] left-[45%] w-[400px] h-[400px] rounded-full bg-[#FFF0B8]/40 blur-[110px] pointer-events-none pastel-pulse"
        style={{ animationDelay: '2s' }}
      />

      {/* Gentle Micro-Dot Texture */}
      <div className="absolute inset-0 bg-grid-pastel pointer-events-none opacity-60" />

      {/* Subtle organic SVG curve for natural depth */}
      <div className="absolute bottom-0 left-0 right-0 h-48 opacity-25 pointer-events-none">
        <svg
          viewBox="0 0 1440 220"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,96L80,106.7C160,117,320,139,480,133.3C640,128,800,96,960,90.7C1120,85,1280,107,1360,117.3L1440,128L1440,220L1360,220C1280,220,1120,220,960,220C800,220,640,220,480,220C320,220,160,220,80,220L0,220Z"
            fill="url(#pastelCurveGrad)"
          />
          <defs>
            <linearGradient id="pastelCurveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EAE5FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFF9F2" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
