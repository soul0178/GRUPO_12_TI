import axios from 'axios';
import type { ProblemDetail } from '@/shared/types/api';

const DEFAULT_MESSAGE = 'Ocurrió un error inesperado. Intente nuevamente.';
const NETWORK_MESSAGE = 'No se pudo conectar con el servidor.';

/** Extrae el mensaje en español de un error de la API (ProblemDetail) para mostrarlo al usuario. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ProblemDetail>(error)) {
    if (!error.response) {
      return NETWORK_MESSAGE;
    }
    return error.response.data?.detail ?? DEFAULT_MESSAGE;
  }
  return DEFAULT_MESSAGE;
}
