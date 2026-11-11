/** Respuesta paginada del backend (PageResponse). */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Error del backend en formato ProblemDetail (RFC 7807). */
export interface ProblemDetail {
  status: number;
  detail?: string;
  /** Mensajes por campo cuando falla la validación (400). */
  errors?: string[];
}
