"""Entidad Perfil: subordinada a Usuario (no existe sin cuenta)."""
from dataclasses import dataclass, field

from app.iam_usuarios.domain.errores import DatosInvalidos
from app.iam_usuarios.domain.value_objects import DatosContacto


@dataclass
class Perfil:
    perfil_id: str
    nombres: str
    apellidos: str
    codigo_institucional: str | None = None
    contacto: DatosContacto = field(default_factory=DatosContacto)

    def __post_init__(self) -> None:
        self.nombres = self.nombres.strip()
        self.apellidos = self.apellidos.strip()
        if not self.nombres or not self.apellidos:
            raise DatosInvalidos("Nombres y apellidos son obligatorios")
        if self.codigo_institucional is not None:
            self.codigo_institucional = self.codigo_institucional.strip() or None
