import type { ComponentProps } from 'react';
import { useId } from 'react';

export const INPUT_CLASSES =
  'block w-full rounded-lg border-0 px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 aria-[invalid=true]:ring-red-400';

interface FormFieldProps extends ComponentProps<'input'> {
  label: string;
  /** Mensaje de validación que se muestra bajo el campo. */
  error?: string;
}

/** Campo de formulario con su etiqueta y mensaje de error; se usa con `register` de React Hook Form. */
export function FormField({ label, error, className = '', ...inputProps }: FormFieldProps) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={INPUT_CLASSES}
        {...inputProps}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
