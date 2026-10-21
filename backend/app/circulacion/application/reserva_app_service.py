"""Casos de uso de reservas. Orquesta; las reglas están en el dominio."""
from collections.abc import Callable
from datetime import datetime, timedelta

from app.circulacion.application.dtos import (
    FranjaOcupadaDTO, ReservaDTO, ReservaRespuestaDTO,
)
from app.circulacion.domain.errores import (
    ReservaAjena, ReservaNoEncontrada, UsuarioNoPuedeReservar,
)
from app.circulacion.domain.repositorio import IConsultaUsuarios, IReservaRepository
from app.circulacion.domain.reserva import Reserva
from app.circulacion.domain.validador_disponibilidad import ValidadorDisponibilidadService
from app.circulacion.domain.value_objects import FranjaHoraria, a_utc_naive, ahora_utc


def a_dto(r: Reserva) -> ReservaRespuestaDTO:
    return ReservaRespuestaDTO(
        reserva_id=r.reserva_id, solicitante_id=r.solicitante_id, item_id=r.item_id,
        inicio=r.franja.inicio, fin=r.franja.fin, estado=r.estado, creada_en=r.creada_en,
    )


class ReservaAppService:
    def __init__(
        self,
        reservas: IReservaRepository,
        usuarios: IConsultaUsuarios,
        validador: ValidadorDisponibilidadService,
        reloj: Callable[[], datetime] = ahora_utc,  # inyectable: las pruebas fijan la hora
    ) -> None:
        self._reservas = reservas
        self._usuarios = usuarios
        self._validador = validador
        self._reloj = reloj

    def procesar_reserva(self, solicitante_id: str, dto: ReservaDTO) -> ReservaRespuestaDTO:
        """Crea y confirma la reserva en un solo paso (RNF-03: reservar en máx. 3 pasos)."""
        if not self._usuarios.puede_solicitar_prestamos(solicitante_id):  # RN-02
            raise UsuarioNoPuedeReservar("Tu cuenta no está activa: no puedes reservar")

        franja = FranjaHoraria(dto.inicio, dto.fin)
        reserva = Reserva.crear(solicitante_id, dto.item_id, franja, ahora=self._reloj())
        self._validador.verificar_item_disponible(dto.item_id, franja)  # 409 si no
        reserva.confirmar()
        self._reservas.guardar(reserva)  # el repositorio revalida el solapamiento al escribir
        return a_dto(reserva)

    def cancelar(
        self, reserva_id: str, usuario_id: str, es_admin: bool = False
    ) -> ReservaRespuestaDTO:
        reserva = self._buscar(reserva_id)
        if reserva.solicitante_id != usuario_id and not es_admin:
            raise ReservaAjena("No puedes cancelar la reserva de otra persona")
        reserva.cancelar()
        self._reservas.guardar(reserva)
        return a_dto(reserva)

    def mis_reservas(self, usuario_id: str) -> list[ReservaRespuestaDTO]:
        return [a_dto(r) for r in self._reservas.listar_por_usuario(usuario_id)]

    def todas(self) -> list[ReservaRespuestaDTO]:
        return [a_dto(r) for r in self._reservas.listar_todas()]

    def disponibilidad(
        self, item_id: str, desde: datetime | None = None, hasta: datetime | None = None
    ) -> list[FranjaOcupadaDTO]:
        """Horarios ya ocupados del ítem (RF-05). Por defecto, los próximos 30 días."""
        d = a_utc_naive(desde) if desde else self._reloj()
        h = a_utc_naive(hasta) if hasta else d + timedelta(days=30)
        return [
            FranjaOcupadaDTO(inicio=r.franja.inicio, fin=r.franja.fin)
            for r in self._reservas.listar_por_item(item_id, d, h)
        ]

    def expirar_vencidas(self) -> int:
        """Marca EXPIRADA toda reserva cuya franja pasó sin retiro. Lo llamará el scheduler (Fase 4)."""
        cantidad = 0
        for r in self._reservas.listar_vencidas(self._reloj()):
            r.expirar()
            self._reservas.guardar(r)
            cantidad += 1
        return cantidad

    def _buscar(self, reserva_id: str) -> Reserva:
        r = self._reservas.buscar_por_id(reserva_id)
        if r is None:
            raise ReservaNoEncontrada("Reserva no encontrada")
        return r
