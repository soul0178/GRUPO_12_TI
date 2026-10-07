"""Traduce errores de dominio a respuestas HTTP."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.shared.errores import (
    ErrorConflicto,
    ErrorDominio,
    ErrorNoAutenticado,
    ErrorNoEncontrado,
    ErrorPermisoDenegado,
    ErrorValidacion,
)

# Orden importa: se usa el primer tipo que coincida
_ESTADOS: list[tuple[type[ErrorDominio], int]] = [
    (ErrorValidacion, 422),
    (ErrorNoAutenticado, 401),
    (ErrorPermisoDenegado, 403),
    (ErrorNoEncontrado, 404),
    (ErrorConflicto, 409),
]


def registrar_manejadores(app: FastAPI) -> None:
    @app.exception_handler(ErrorDominio)
    async def _manejar(_: Request, exc: ErrorDominio) -> JSONResponse:
        estado = next((c for t, c in _ESTADOS if isinstance(exc, t)), 400)
        headers = {"WWW-Authenticate": "Bearer"} if estado == 401 else None
        return JSONResponse(status_code=estado, content={"detail": str(exc)}, headers=headers)
