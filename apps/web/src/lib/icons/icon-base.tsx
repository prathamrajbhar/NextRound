import React from 'react';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
  className?: string;
  strokeWidth?: number | string;
}

export const sizeMap: Record<string, string> = {
  'h-3': '12px', 'w-3': '12px',
  'h-3.5': '14px', 'w-3.5': '14px',
  'h-4': '16px', 'w-4': '16px',
  'h-5': '20px', 'w-5': '20px',
  'h-6': '24px', 'w-6': '24px',
  'h-8': '32px', 'w-8': '32px',
  'h-10': '40px', 'w-10': '40px',
  'h-12': '48px', 'w-12': '48px',
};

export const createMaterialIcon = (iconName: string) => {
  const Component = React.forwardRef<HTMLSpanElement, IconProps>(
    ({ size, className = '', ...props }, ref) => {
      let fontSize = size ? (typeof size === 'number' ? `${size}px` : size) : undefined;

      if (!fontSize) {
        const classes = className.split(' ');
        for (const cls of classes) {
          if (sizeMap[cls]) {
            fontSize = sizeMap[cls];
            break;
          }
        }
      }

      if (!fontSize) {
        fontSize = '20px';
      }

      return (
        <span
          ref={ref}
          className={`material-symbols-outlined select-none align-middle ${className}`}
          style={{
            fontSize,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            width: fontSize,
            height: fontSize,
          }}
          {...props}
        >
          {iconName}
        </span>
      );
    }
  );
  Component.displayName = iconName;
  return Component;
};
