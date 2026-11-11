/** Mensaje para listados sin resultados. */
export function EmptyState({ message }: { message: string }) {
  return <p className="py-12 text-center text-sm text-slate-500">{message}</p>;
}
