import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7AFF]/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs sm:text-sm px-3.5 py-2 min-h-[40px] gap-1.5',
    md: 'text-sm sm:text-base px-4 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base sm:text-lg px-6 py-3 min-h-[48px] gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#1F7AFF] text-white hover:bg-[#1664D6] shadow-sm',
    secondary: 'bg-[#0B1F45] text-white hover:bg-[#06152E]',
    outline: 'border border-[#E6E6E1] bg-white text-[#06152E] hover:bg-[#F4F4F0] hover:border-[#D1D1C7]',
    ghost: 'text-[#0B1F45] hover:bg-[#EAEAE5]/60',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
