"""DTOs de reservas (informe 2.2: ReservaDTO)."""
from datetime import datetime

from pydantic import BaseModel

from app.circulacion.domain.value_objects import EstadoReserva


class ReservaDTO(BaseModel):
    """Entrada: el solicitante NO viaja en el cuerpo, sale del token."""

    item_id: str
    inicio: datetime
    fin: datetime


class ReservaRespuestaDTO(BaseModel):
    reserva_id: str
    solicitante_id: str
    item_id: str
    inicio: datetime
    fin: datetime
    estado: EstadoReserva
    creada_en: datetime


class FranjaOcupadaDTO(BaseModel):
    """Disponibilidad pública: solo el horario, sin datos de quién reservó."""

    inicio: datetime
    fin: datetime
