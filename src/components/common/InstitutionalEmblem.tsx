/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface InstitutionalEmblemProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const InstitutionalEmblem: React.FC<InstitutionalEmblemProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const pixelSizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const currentSizeClass = sizeMap[size] || 'w-12 h-12';
  const dim = pixelSizeMap[size] || 48;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className={`${currentSizeClass} shrink-0 drop-shadow-sm select-none`}
        aria-label="Escudo Institucional del Consejo Municipal de Juventud de Flandes Tolima"
        role="img"
      >
        <defs>
          {/* Tolima Maroon & Gold Gradients */}
          <linearGradient id="vinotintoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#881313" />
            <stop offset="50%" stopColor="#6b0c0c" />
            <stop offset="100%" stopColor="#4a0404" />
          </linearGradient>

          <linearGradient id="oroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="magdalenaBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Text Path Circle */}
          <path
            id="textCircle"
            d="M 60,60 m -46,0 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0"
          />
        </defs>

        {/* Outer Circular Border with Gold Accents */}
        <circle cx="60" cy="60" r="58" fill="#4a0404" stroke="url(#oroGrad)" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="54" fill="none" stroke="url(#oroGrad)" strokeWidth="1" strokeDasharray="2,2" />

        {/* Colombian Tricolor Arc at top */}
        <path d="M 18,60 A 42,42 0 0,1 102,60" fill="none" stroke="#FCD116" strokeWidth="3" />
        <path d="M 22,60 A 38,38 0 0,1 98,60" fill="none" stroke="#003893" strokeWidth="2" />
        <path d="M 26,60 A 34,34 0 0,1 94,60" fill="none" stroke="#CE1126" strokeWidth="2" />

        {/* Inner Shield Body */}
        <path
          d="M 36,36 L 84,36 C 84,65 60,88 60,92 C 60,88 36,65 36,36 Z"
          fill="url(#vinotintoGrad)"
          stroke="url(#oroGrad)"
          strokeWidth="2"
        />

        {/* Shield Internal Partition: Upper Sun / Liberty, Lower Magdalena River waves */}
        {/* Upper Sun of youth leadership */}
        <circle cx="60" cy="48" r="6" fill="url(#oroGrad)" />
        {/* Sun rays */}
        <line x1="60" y1="38" x2="60" y2="41" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="60" y1="55" x2="60" y2="58" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="50" y1="48" x2="53" y2="48" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="67" y1="48" x2="70" y2="48" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="53" y1="41" x2="55" y2="43" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="67" y1="41" x2="65" y2="43" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />

        {/* Lower River Waves (Río Magdalena) */}
        <path
          d="M 44,66 Q 52,62 60,66 Q 68,70 76,66 L 75,72 Q 68,76 60,72 Q 52,68 45,72 Z"
          fill="#38bdf8"
          opacity="0.9"
        />
        <path
          d="M 49,74 Q 55,71 60,74 Q 65,77 71,74 L 60,85 Z"
          fill="#0284c7"
          opacity="0.9"
        />

        {/* Letters CMJ */}
        <text
          x="60"
          y="62"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8"
          fontWeight="800"
          fontFamily="serif"
          letterSpacing="1"
        >
          CMJ
        </text>

        {/* Lower Stars of Representation */}
        <polygon points="60,98 62,102 66,102 63,105 64,109 60,107 56,109 57,105 54,102 58,102" fill="url(#oroGrad)" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-serif font-bold text-sm leading-tight text-stone-900 dark:text-white">
            CMJ FLANDES
          </span>
          <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-sans font-semibold">
            Tolima · 2026-2029
          </span>
        </div>
      )}
    </div>
  );
};
