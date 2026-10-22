import React from 'react';

export interface SylloraLogoProps {
  /**
   * Predefined size presets or custom width/height.
   * - 'xs': 28px (ultra compact)
   * - 'sm': 34px (mobile header)
   * - 'md': 40px (desktop header / cards)
   * - 'lg': 52px (modals)
   * - 'xl': 72px (auth views)
   * - '2xl': 96px (hero showcase)
   * - 'hero': 120px (feature banner)
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero' | number;
  showWordmark?: boolean;
  wordmarkSize?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string | boolean;
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  alt?: string;
  priority?: boolean;
}

const sizeMap: Record<string, { width: number; height: number; classStr: string }> = {
  xs: { width: 28, height: 28, classStr: 'w-7 h-7' },
  sm: { width: 34, height: 34, classStr: 'w-[34px] h-[34px]' },
  md: { width: 40, height: 40, classStr: 'w-10 h-10' },
  lg: { width: 52, height: 52, classStr: 'w-[52px] h-[52px]' },
  xl: { width: 72, height: 72, classStr: 'w-[72px] h-[72px]' },
  '2xl': { width: 96, height: 96, classStr: 'w-24 h-24' },
  hero: { width: 120, height: 120, classStr: 'w-[120px] h-[120px]' },
};

export const SylloraLogo: React.FC<SylloraLogoProps> = ({
  size = 'md',
  showWordmark = false,
  wordmarkSize = 'md',
  subtitle,
  className = '',
  imgClassName = '',
  onClick,
  alt = 'SYLLORA AI — Your AI Study Companion',
  priority = false,
}) => {
  const isPreset = typeof size === 'string' && sizeMap[size];
  const sizeConfig = isPreset
    ? sizeMap[size]
    : {
        width: typeof size === 'number' ? size : 40,
        height: typeof size === 'number' ? size : 40,
        classStr: '',
      };

  const style = !isPreset && typeof size === 'number'
    ? { width: `${size}px`, height: `${size}px` }
    : undefined;

  const defaultSubtitle =
    subtitle === true
      ? 'Your AI Study Companion'
      : typeof subtitle === 'string'
      ? subtitle
      : null;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <div
        style={style}
        className={`relative shrink-0 rounded-full overflow-hidden shadow-[0_2px_10px_rgba(24,47,83,0.12)] border border-[#EEEAF4] bg-white transition-all duration-300 ${
          onClick ? 'group-hover:scale-105 group-hover:shadow-[0_4px_16px_rgba(21,158,154,0.22)]' : ''
        } ${sizeConfig.classStr}`}
      >
        <img
          src="/syllora-logo.png"
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`w-full h-full object-contain select-none transition-transform duration-300 ${imgClassName}`}
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 font-extrabold tracking-tight leading-none">
            <span
              className={`text-[#182F53] font-bold tracking-tight ${
                wordmarkSize === 'sm'
                  ? 'text-base sm:text-lg'
                  : wordmarkSize === 'lg'
                  ? 'text-2xl sm:text-3xl'
                  : wordmarkSize === 'xl'
                  ? 'text-3xl sm:text-4xl'
                  : 'text-lg sm:text-xl'
              }`}
            >
              SYLLORA
            </span>
            <span
              className={`font-black text-[#159E9A] ${
                wordmarkSize === 'sm'
                  ? 'text-base sm:text-lg'
                  : wordmarkSize === 'lg'
                  ? 'text-2xl sm:text-3xl'
                  : wordmarkSize === 'xl'
                  ? 'text-3xl sm:text-4xl'
                  : 'text-lg sm:text-xl'
              }`}
            >
              AI
            </span>
            <span className="text-[#D9A441] text-xs -mt-2">✦</span>
          </div>

          {defaultSubtitle && (
            <span className="text-[10px] text-[#777589] font-medium tracking-wide mt-0.5 truncate">
              {defaultSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
export default SylloraLogo;
