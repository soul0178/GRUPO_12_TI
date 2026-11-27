interface AlertProps {
  variant: 'error' | 'success' | 'info';
  children: string;
}

const STYLES = {
  error: 'border-red-600 bg-red-50 text-red-800',
  success: 'border-emerald-600 bg-emerald-50 text-emerald-800',
  info: 'border-primary-600 bg-primary-50 text-primary-800',
};

/** Aviso de error (role="alert"), de éxito o informativo (role="status"): franja gruesa a la izquierda. */
export function Alert({ variant, children }: AlertProps) {
  return (
    <p
      role={variant === 'error' ? 'alert' : 'status'}
      className={`border-l-4 px-4 py-3 text-sm ${STYLES[variant]}`}
    >
      {children}
    </p>
  );
}
