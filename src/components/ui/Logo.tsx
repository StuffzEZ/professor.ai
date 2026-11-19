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
      <rect width="32" height="32" rx="6" fill="#080919" />
      <rect x="4" y="8" width="20" height="16" rx="2" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="14" cy="16" r="3" fill={color} />
      <circle cx="22" cy="16" r="2" fill={color} opacity="0.6" />
      <path d="M8 24h16v2H8z" fill={color} />
    </svg>
  );
}
