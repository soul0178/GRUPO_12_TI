/** Indicador de carga con un mensaje en español. */
export function LoadingState({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-3 py-10 text-sm text-slate-500">
      <svg
        className="h-5 w-5 animate-spin text-indigo-600"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {message}
    </p>
  );
}
