"""Objetos de valor del contexto Catálogo (informe 2.1.2)."""
from enum import Enum


class TipoItem(str, Enum):
    LIBRO = "LIBRO"
    EQUIPO = "EQUIPO"
    OBJETO = "OBJETO"


class EstadoFisico(str, Enum):
    """Shared Kernel: también lo usan Entrega y Devolucion (RF-07)."""

    BUENO = "BUENO"
    REGULAR = "REGULAR"
    DANADO = "DANADO"


class EstadoDisponibilidad(str, Enum):
    DISPONIBLE = "DISPONIBLE"
    PRESTADO = "PRESTADO"
    EN_MANTENIMIENTO = "EN_MANTENIMIENTO"
    DADO_DE_BAJA = "DADO_DE_BAJA"
