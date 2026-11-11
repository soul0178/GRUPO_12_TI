interface AlertProps {
  variant: 'error' | 'success';
  children: string;
}

const STYLES = {
  error: 'bg-red-50 text-red-800 ring-red-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
};

/** Aviso de error (role="alert") o de éxito (role="status") con un mensaje en español. */
export function Alert({ variant, children }: AlertProps) {
  return (
    <p
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${STYLES[variant]}`}
    >
      {children}
    </p>
  );
}
