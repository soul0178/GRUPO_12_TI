"""Puerto: interfaces que el dominio exige a la infraestructura (inversión de dependencias)."""
from abc import ABC, abstractmethod
from datetime import datetime

from app.circulacion.domain.reserva import Reserva
from app.circulacion.domain.value_objects import FranjaHoraria


class IReservaRepository(ABC):
    @abstractmethod
    def guardar(self, reserva: Reserva) -> None: ...

    @abstractmethod
    def buscar_por_id(self, reserva_id: str) -> Reserva | None: ...

    @abstractmethod
    def buscar_solapadas(
        self, item_id: str, franja: FranjaHoraria, excluir_id: str | None = None
    ) -> list[Reserva]:
        """Reservas PENDIENTE/CONFIRMADA del ítem que se cruzan con la franja."""

    @abstractmethod
    def listar_por_usuario(self, usuario_id: str) -> list[Reserva]: ...

    @abstractmethod
    def listar_por_item(self, item_id: str, desde: datetime, hasta: datetime) -> list[Reserva]:
        """Reservas vigentes (que bloquean horario) del ítem dentro del rango."""

    @abstractmethod
    def listar_todas(self) -> list[Reserva]: ...

    @abstractmethod
    def listar_vencidas(self, ahora: datetime) -> list[Reserva]:
        """PENDIENTE/CONFIRMADA cuya franja ya terminó (para el job de expiración)."""


class IConsultaUsuarios(ABC):
    """Consulta por UsuarioId al contexto IAM (diagrama de eventos: CIR ..> IAM)."""

    @abstractmethod
    def puede_solicitar_prestamos(self, usuario_id: str) -> bool: ...


class IConsultaItems(ABC):
    """Consulta por ItemId al contexto Catálogo (CIR ..> CAT)."""

    @abstractmethod
    def es_reservable(self, item_id: str) -> bool:
        """Lanza ItemNoEncontrado si el ítem no existe."""
