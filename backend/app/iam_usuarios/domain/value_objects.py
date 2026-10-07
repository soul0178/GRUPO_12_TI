"""Objetos de valor del contexto IAM (informe 2.1.1)."""
import re
from dataclasses import dataclass
from enum import Enum

from app.iam_usuarios.domain.errores import DatosInvalidos

_PATRON_CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validar_correo(correo: str) -> str:
    """Normaliza (minúsculas, sin espacios) y valida el formato básico."""
    correo = correo.strip().lower()
    if not _PATRON_CORREO.match(correo):
        raise DatosInvalidos("Correo con formato inválido")
    return correo


class Rol(str, Enum):
    ESTUDIANTE = "ESTUDIANTE"
    DOCENTE = "DOCENTE"
    ADMINISTRATIVO = "ADMINISTRATIVO"
    ADMINISTRADOR_SISTEMA = "ADMINISTRADOR_SISTEMA"


class EstadoCuenta(str, Enum):
    ACTIVA = "ACTIVA"
    SUSPENDIDA = "SUSPENDIDA"  # RN-02: no puede reservar ni pedir préstamos
    INACTIVA = "INACTIVA"


@dataclass(frozen=True)
class DatosContacto:
    """Inmutable: al actualizar el perfil se reemplaza completo."""

    telefono: str = ""
    direccion: str = ""
    correo_alterno: str = ""

    def __post_init__(self) -> None:
        if self.correo_alterno:
            validar_correo(self.correo_alterno)
