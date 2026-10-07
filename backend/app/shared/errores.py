"""Errores de dominio base, reutilizables por todos los contextos.

El dominio NO conoce HTTP: la capa de presentación traduce cada tipo
a un código de estado (ver manejo_errores.py).
"""


class ErrorDominio(Exception):
    """Cualquier regla de negocio violada."""


class ErrorValidacion(ErrorDominio):
    """Datos inválidos (422)."""


class ErrorNoAutenticado(ErrorDominio):
    """Credenciales o token inválidos (401)."""


class ErrorPermisoDenegado(ErrorDominio):
    """El usuario no tiene permiso para la operación (403)."""


class ErrorNoEncontrado(ErrorDominio):
    """El recurso no existe (404)."""


class ErrorConflicto(ErrorDominio):
    """Estado incompatible, duplicado o modificación concurrente (409)."""
