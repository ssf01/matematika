import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary:
    'accent-gradient text-on-accent shadow-lg shadow-black/25 hover:brightness-110 disabled:shadow-none disabled:saturate-50',
  secondary: 'bg-white/12 hover:bg-white/20 text-white border border-white/25',
  ghost: 'bg-transparent hover:bg-white/10 text-white',
  danger: 'bg-red-500/25 hover:bg-red-500/35 text-red-100 border border-red-400/50',
};

const sizes = {
  sm: 'px-4 min-h-11 text-base',
  md: 'px-6 min-h-13 text-lg',
  lg: 'px-8 min-h-16 text-xl',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold tracking-wide
        transition-[transform,filter,background-color] duration-150 min-w-12
        disabled:opacity-45 disabled:cursor-not-allowed
        enabled:active:scale-[0.97] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
