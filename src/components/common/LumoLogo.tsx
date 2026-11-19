import React from 'react';

interface LumoLogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

export const LumoLogo: React.FC<LumoLogoProps> = ({
  size = 32,
  withWordmark = false,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="flex items-center justify-center rounded-xl bg-[#FFFC00] text-black shrink-0 shadow-[0_0_20px_rgba(255,252,0,0.2)]"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-[68%] h-[68%]"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 5C12.8 5 8.5 10.1 8.5 16.9c0 3.5-.7 5.7-2.8 7.1-1 .6-.8 2.1.3 2.4 2 .6 3.4 1.1 4.1 2 .6.7.2 2.1 1.5 2.7 2.3 1.1 4.7-.3 8.4-.3s6.1 1.4 8.4.3c1.3-.6.9-2 1.5-2.7.7-.9 2.1-1.4 4.1-2 1.1-.3 1.3-1.8.3-2.4-2.1-1.4-2.8-3.6-2.8-7.1C31.5 10.1 27.2 5 20 5z"
            fill="#000000"
          />
          <circle cx="16.5" cy="17" r="1.7" fill="#FFFC00" />
          <circle cx="23.5" cy="17" r="1.7" fill="#FFFC00" />
        </svg>
      </div>
      {withWordmark && (
        <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
          Lumo
        </span>
      )}
    </div>
  );
};
