import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-white/20 hover:bg-white/30 text-white border border-white/20',
  secondary: 'bg-transparent hover:bg-white/10 text-white border-2 border-white/30',
  ghost: 'bg-transparent hover:bg-white/5 text-white/70 hover:text-white',
  danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-semibold
        transition-all duration-200 min-h-[44px] min-w-[44px]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-95 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
