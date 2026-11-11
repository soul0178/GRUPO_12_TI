import type { ComponentProps } from 'react';
import { useId } from 'react';
import { INPUT_CLASSES } from '@/shared/components/FormField';

interface SelectFieldProps extends ComponentProps<'select'> {
  label: string;
  error?: string;
}

/** Lista desplegable con su etiqueta; se usa con `register` de React Hook Form. */
export function SelectField({
  label,
  error,
  className = '',
  children,
  ...selectProps
}: SelectFieldProps) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={INPUT_CLASSES}
        {...selectProps}
      >
        {children}
      </select>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
