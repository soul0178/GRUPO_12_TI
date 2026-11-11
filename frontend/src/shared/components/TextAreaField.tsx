import type { ComponentProps } from 'react';
import { useId } from 'react';
import { INPUT_CLASSES } from '@/shared/components/FormField';

interface TextAreaFieldProps extends ComponentProps<'textarea'> {
  label: string;
  error?: string;
}

/** Área de texto con su etiqueta; se usa con `register` de React Hook Form. */
export function TextAreaField({
  label,
  error,
  className = '',
  ...textareaProps
}: TextAreaFieldProps) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        className={INPUT_CLASSES}
        {...textareaProps}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
