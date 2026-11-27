import type { ComponentProps } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-700 text-white hover:bg-primary-600 focus-visible:outline-primary-700',
  secondary:
    'bg-white text-slate-800 ring-1 ring-inset ring-slate-400 hover:bg-slate-100 focus-visible:outline-slate-500',
  danger:
    'bg-white text-red-700 ring-1 ring-inset ring-red-400 hover:bg-red-50 focus-visible:outline-red-500',
};

const SIZES: Record<Size, string> = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-2.5 py-1.5 text-xs',
};

/** Botón con variantes (principal, secundario, peligro); por defecto es de tipo "button". */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center  font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
