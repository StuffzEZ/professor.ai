import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  variant?: 'default' | 'white' | 'accent';
}

export function Logo({ size = 24, variant = 'default', className, ...props }: LogoProps) {
  const colors = {
    default: '#6c8cff',
    white: '#ffffff',
    accent: '#6c8cff',
  };

  const color = colors[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Background tile */}
      <rect width="32" height="32" rx="7" fill="#080919" />

      {/* Stylised "P" monogram — the dot of the P doubles as an AI spark */}
      <path
        d="M10 8h7a5 5 0 0 1 0 10h-7V8z"
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M10 18h7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="22" cy="22" r="2.6" fill={color} />

      {/* Small accent tick bottom-left */}
      <circle cx="8" cy="24" r="1.4" fill={color} opacity="0.5" />
    </svg>
  );
}
