import type { ComponentProps } from 'react';

/** Contenedor blanco con borde y sombra suave para agrupar contenido. */
export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={`rounded-xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}
      {...props}
    />
  );
}
