import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Botones o enlaces de acción a la derecha del título. */
  actions?: ReactNode;
}

/** Encabezado de página con título, descripción opcional y acciones. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="border-l-8 border-accent-500 pl-4">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
