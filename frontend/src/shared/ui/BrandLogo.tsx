import React, { useId } from 'react';

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  /** If provided, renders an <img> instead of the inline SVG */
  logoUrl?: string;
}

export default function BrandLogo({ className = '', compact = false, logoUrl }: BrandLogoProps) {
  const shadowId = `brand-logo-shadow-${useId().replace(/:/g, '')}`;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Brand logo"
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 360 190"
      role="img"
      aria-label="Ethio Robotics logo"
      className={className}
    >
      <defs>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#101426" floodOpacity="0.18" />
        </filter>
      </defs>
      <g filter={`url(#${shadowId})`}>
        <g transform="translate(180 92)">
          {Array.from({ length: 14 }).map((_, index) => (
            <rect
              key={index}
              x="-11"
              y="-82"
              width="22"
              height="35"
              rx="2"
              fill="#ed1c24"
              transform={`rotate(${index * (360 / 14)})`}
            />
          ))}
          <circle r="66" fill="#ed1c24" />
          <circle r="46" fill="#25338d" />
        </g>

        {!compact && (
          <rect
            x="48"
            y="76"
            width="264"
            height="62"
            rx="2"
            fill="#25338d"
            stroke="#111a5f"
            strokeWidth="3"
          />
        )}

        {compact ? (
          <>
            <text
              x="180"
              y="86"
              textAnchor="middle"
              fontFamily="Inter, Arial, sans-serif"
              fontSize="23"
              fontWeight="900"
              fill="#ffffff"
              letterSpacing="1.5"
            >
              ETHIO
            </text>
            <text
              x="180"
              y="118"
              textAnchor="middle"
              fontFamily="Inter, Arial, sans-serif"
              fontSize="32"
              fontWeight="900"
              fill="#ffffff"
              letterSpacing="-1"
            >
              ER
            </text>
          </>
        ) : (
          <>
            <text
              x="180"
              y="97"
              textAnchor="middle"
              fontFamily="Inter, Arial, sans-serif"
              fontSize="24"
              fontWeight="900"
              fill="#ffffff"
              letterSpacing="1.5"
            >
              ETHIO
            </text>
            <text
              x="180"
              y="128"
              textAnchor="middle"
              fontFamily="Inter, Arial, sans-serif"
              fontSize="48"
              fontWeight="900"
              fill="#ffffff"
              letterSpacing="-1"
            >
              ROBOTICS
            </text>
          </>
        )}
      </g>
    </svg>
  );
}
