import React, { useCallback, useId } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface AnimatedThemeTogglerProps {
  className?: string;
  duration?: number;
}

export const AnimatedThemeToggler: React.FC<AnimatedThemeTogglerProps> = ({
  className = '',
  duration = 400,
}) => {
  const { theme, toggleTheme } = useTheme();
  const id = useId();
  const isDark = theme === 'dark';

  const handleToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const transitionStyle = `${duration}ms ease-in-out`;

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={handleToggle}
      className={`relative inline-flex items-center justify-center rounded-full p-2 transition-colors hover:bg-light-200 dark:hover:bg-dark-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 text-dark-700 dark:text-dark-200"
        style={{ transition: `transform ${transitionStyle}` }}
      >
        {/* Mask to create the moon crescent cutout */}
        <defs>
          <mask id={`${id}-moon-mask`}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <circle
              cx={isDark ? 17 : 28}
              cy={isDark ? 7 : 0}
              r="5"
              fill="black"
              style={{ transition: `cx ${transitionStyle}, cy ${transitionStyle}` }}
            />
          </mask>
        </defs>

        {/* Sun/Moon circle body */}
        <circle
          cx="12"
          cy="12"
          r={isDark ? 8 : 4.5}
          fill="currentColor"
          stroke="none"
          mask={`url(#${id}-moon-mask)`}
          style={{ transition: `r ${transitionStyle}` }}
        />

        {/* Sun rays — scale to 0 when dark */}
        <g
          style={{
            transformOrigin: 'center',
            transition: `opacity ${transitionStyle}, transform ${transitionStyle}`,
            opacity: isDark ? 0 : 1,
            transform: isDark ? 'scale(0) rotate(45deg)' : 'scale(1) rotate(0deg)',
          }}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>
    </button>
  );
};
