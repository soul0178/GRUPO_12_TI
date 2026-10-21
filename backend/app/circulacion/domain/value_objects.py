"""Objetos de valor del contexto Circulación (informe 2.1.3)."""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum

from app.circulacion.domain.errores import FranjaInvalida


def a_utc_naive(instante: datetime) -> datetime:
    """Normaliza a UTC sin zona horaria.

    Todo el sistema trabaja en UTC; el frontend convierte a hora local al mostrar.
    Un datetime sin zona se interpreta como UTC.
    """
    if instante.tzinfo is not None:
        instante = instante.astimezone(timezone.utc).replace(tzinfo=None)
    return instante.replace(microsecond=0)


def ahora_utc() -> datetime:
    return a_utc_naive(datetime.now(timezone.utc))


class EstadoReserva(str, Enum):
    PENDIENTE = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"
    EXPIRADA = "EXPIRADA"
    CONVERTIDA = "CONVERTIDA"


# Estados que ocupan el horario del ítem (los demás lo liberan)
ESTADOS_QUE_BLOQUEAN = (EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA)


@dataclass(frozen=True)
class FranjaHoraria:
    """Intervalo semiabierto [inicio, fin): dos franjas contiguas NO se solapan."""

    inicio: datetime
    fin: datetime

    def __post_init__(self) -> None:
        # frozen=True: se normaliza con object.__setattr__
        object.__setattr__(self, "inicio", a_utc_naive(self.inicio))
        object.__setattr__(self, "fin", a_utc_naive(self.fin))
        if self.fin <= self.inicio:
            raise FranjaInvalida("La hora de fin debe ser posterior a la de inicio")

    def solapa_con(self, otra: "FranjaHoraria") -> bool:
        return self.inicio < otra.fin and otra.inicio < self.fin

    def contiene(self, instante: datetime) -> bool:
        return self.inicio <= a_utc_naive(instante) < self.fin

    def duracion(self) -> timedelta:
        return self.fin - self.inicio
