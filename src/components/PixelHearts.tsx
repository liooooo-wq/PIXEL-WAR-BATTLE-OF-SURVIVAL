import React from 'react';

interface PixelHeartsProps {
  lives: number;
  maxLives?: number;
  size?: 'sm' | 'md';
}

export const PixelHearts: React.FC<PixelHeartsProps> = ({
  lives,
  maxLives = 3,
  size = 'md',
}) => {
  const total = Math.max(maxLives, lives, 3);
  const pxSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-1" aria-label={`Nyawa: ${lives}`}>
      {Array.from({ length: total }).map((_, idx) => {
        const active = idx < lives;
        return (
          <svg
            key={idx}
            viewBox="0 0 16 14"
            className={`${pxSize} shrink-0`}
            shapeRendering="crispEdges"
          >
            <path
              d="M2 0h4v2h4V0h4v2h2v5h-2v2h-2v2h-2v2H6v-2H4V9H2V7H0V2h2V0z"
              fill={active ? '#991b1b' : '#1e293b'}
            />
            <path
              d="M2 2h4v2h4V2h4v5h-2v2h-2v2H6V9H4V7H2V2z"
              fill={active ? '#f43f5e' : '#334155'}
            />
            {active && <rect x="3" y="3" width="2" height="2" fill="#fecdd3" />}
          </svg>
        );
      })}
    </div>
  );
};
