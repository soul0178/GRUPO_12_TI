"""Servicio de dominio: impide la duplicidad de reservas en el mismo horario (RNF-02)."""
from app.circulacion.domain.errores import FranjaOcupada, ItemNoReservable
from app.circulacion.domain.repositorio import IConsultaItems, IReservaRepository
from app.circulacion.domain.value_objects import FranjaHoraria


class ValidadorDisponibilidadService:
    def __init__(self, reservas: IReservaRepository, items: IConsultaItems) -> None:
        self._reservas = reservas
        self._items = items

    def verificar_duplicidad_horarios(
        self, item_id: str, franja: FranjaHoraria, excluir_id: str | None = None
    ) -> bool:
        """True si NO hay duplicidad (la franja está libre)."""
        return not self._reservas.buscar_solapadas(item_id, franja, excluir_id)

    def verificar_item_disponible(self, item_id: str, franja: FranjaHoraria) -> None:
        """Lanza ItemNoReservable o FranjaOcupada; si no lanza, se puede reservar."""
        if not self._items.es_reservable(item_id):
            raise ItemNoReservable("El ítem no está disponible para reservas")
        if not self.verificar_duplicidad_horarios(item_id, franja):
            raise FranjaOcupada("El ítem ya está reservado en ese horario")
