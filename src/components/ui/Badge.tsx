import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'subtle' | 'outline';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs sm:text-sm px-3 py-1',
  };

  const variantStyles = {
    default: 'bg-[#0B1F45] text-white',
    accent: 'bg-[#1F7AFF]/10 text-[#1F7AFF]',
    subtle: 'bg-[#F0F0EC] text-[#06152E]',
    outline: 'border border-[#E6E6E1] text-[#06152E] bg-white',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
