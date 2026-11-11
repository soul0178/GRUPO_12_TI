type Tone = 'indigo' | 'green' | 'slate' | 'amber' | 'red';

interface BadgeProps {
  tone?: Tone;
  children: string;
}

const TONES: Record<Tone, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
};

/** Etiqueta pequeña de color para roles y estados. */
export function Badge({ tone = 'slate', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
