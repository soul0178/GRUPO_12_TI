"""Aggregate Root Reserva (informe 2.1.3, RF-05). Máquina de estados: diagrama estados_v2."""
import uuid
from datetime import datetime

from app.circulacion.domain.errores import FranjaInvalida, TransicionReservaInvalida
from app.circulacion.domain.value_objects import (
    EstadoReserva, FranjaHoraria, a_utc_naive, ahora_utc,
)

# Provisional: la Fase 5 lo reemplaza por PoliticaPrestamo.plazo_maximo_horas
DURACION_MAXIMA_HORAS = 24
DURACION_MINIMA_MINUTOS = 15


class Reserva:
    def __init__(
        self,
        reserva_id: str,
        solicitante_id: str,
        item_id: str,
        franja: FranjaHoraria,
        estado: EstadoReserva,
        creada_en: datetime,
        prestamo_id: str | None = None,
        version: int = 0,
    ) -> None:
        self.reserva_id = reserva_id
        self.solicitante_id = solicitante_id
        self.item_id = item_id
        self.franja = franja
        self.estado = estado
        self.creada_en = creada_en
        self.prestamo_id = prestamo_id  # se completa en la Fase 4
        self.version = version  # bloqueo optimista (RNF-02)

    # ---- creación -------------------------------------------------
    @classmethod
    def crear(
        cls, solicitante_id: str, item_id: str, franja: FranjaHoraria,
        ahora: datetime | None = None,
    ) -> "Reserva":
        ahora = a_utc_naive(ahora) if ahora else ahora_utc()
        if franja.inicio <= ahora:
            raise FranjaInvalida("La reserva debe ser para una fecha y hora futura")
        minutos = franja.duracion().total_seconds() / 60
        if minutos < DURACION_MINIMA_MINUTOS:
            raise FranjaInvalida(f"La reserva debe durar al menos {DURACION_MINIMA_MINUTOS} minutos")
        if minutos > DURACION_MAXIMA_HORAS * 60:
            raise FranjaInvalida(f"La reserva no puede superar {DURACION_MAXIMA_HORAS} horas")
        return cls(
            reserva_id=str(uuid.uuid4()), solicitante_id=solicitante_id, item_id=item_id,
            franja=franja, estado=EstadoReserva.PENDIENTE, creada_en=ahora,
        )

    # ---- transiciones ---------------------------------------------
    def confirmar(self) -> None:
        """La ausencia de solapamiento la verifica ValidadorDisponibilidadService antes de llamar."""
        self._exigir(EstadoReserva.PENDIENTE, "confirmar")
        self.estado = EstadoReserva.CONFIRMADA

    def cancelar(self) -> None:
        if self.estado not in (EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA):
            raise TransicionReservaInvalida(
                f"No se puede cancelar una reserva en estado {self.estado.value}"
            )
        self.estado = EstadoReserva.CANCELADA

    def expirar(self) -> None:
        if self.estado not in (EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA):
            raise TransicionReservaInvalida(
                f"No se puede expirar una reserva en estado {self.estado.value}"
            )
        self.estado = EstadoReserva.EXPIRADA

    def marcar_convertida(self, prestamo_id: str) -> None:
        """Lo invocará el flujo de préstamo (Fase 4)."""
        self._exigir(EstadoReserva.CONFIRMADA, "convertir")
        self.estado = EstadoReserva.CONVERTIDA
        self.prestamo_id = prestamo_id

    # ---- consultas ------------------------------------------------
    def bloquea_horario(self) -> bool:
        return self.estado in (EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA)

    def ya_paso(self, ahora: datetime) -> bool:
        return self.franja.fin <= a_utc_naive(ahora)

    def _exigir(self, esperado: EstadoReserva, accion: str) -> None:
        if self.estado != esperado:
            raise TransicionReservaInvalida(
                f"Solo una reserva {esperado.value} puede {accion}; está {self.estado.value}"
            )
