import type { ComponentProps } from 'react';

/** Ficha cuadrada con borde firme y un bloque de sombra desplazado, como una ficha de biblioteca. */
export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={`border border-slate-300 bg-white shadow-[4px_4px_0_0_var(--color-slate-200)] ${className}`}
      {...props}
    />
  );
}
