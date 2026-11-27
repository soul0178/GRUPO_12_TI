interface AlertProps {
  variant: 'error' | 'success' | 'info';
  children: string;
}

const STYLES = {
  error: 'bg-red-50 text-red-800 ring-red-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  info: 'bg-primary-50 text-primary-800 ring-primary-200',
};

/** Aviso de error (role="alert"), de éxito o informativo (role="status") con un mensaje en español. */
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
