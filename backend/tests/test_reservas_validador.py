"""Servicio de dominio ValidadorDisponibilidadService con dobles de prueba (RNF-02)."""
from datetime import datetime

import pytest

from app.circulacion.domain.errores import FranjaOcupada, ItemNoReservable
from app.circulacion.domain.repositorio import IConsultaItems, IReservaRepository
from app.circulacion.domain.reserva import Reserva
from app.circulacion.domain.validador_disponibilidad import ValidadorDisponibilidadService
from app.circulacion.domain.value_objects import FranjaHoraria

AHORA = datetime(2026, 10, 21, 8, 0)


def franja(h_ini, h_fin, dia=22):
    return FranjaHoraria(datetime(2026, 10, dia, h_ini), datetime(2026, 10, dia, h_fin))


def nueva(f):
    return Reserva.crear("u-1", "item-1", f, ahora=AHORA)


class RepoFalso(IReservaRepository):
    def __init__(self, reservas=()):
        self.reservas = list(reservas)

    def buscar_solapadas(self, item_id, franja, excluir_id=None):
        return [r for r in self.reservas if r.item_id == item_id and r.bloquea_horario()
                and r.franja.solapa_con(franja) and r.reserva_id != excluir_id]

    def guardar(self, reserva): ...
    def buscar_por_id(self, reserva_id): ...
    def listar_por_usuario(self, usuario_id): ...
    def listar_por_item(self, item_id, desde, hasta): ...
    def listar_todas(self): ...
    def listar_vencidas(self, ahora): ...


class ItemsFalso(IConsultaItems):
    def __init__(self, reservable=True):
        self.reservable = reservable

    def es_reservable(self, item_id):
        return self.reservable


def test_validador_acepta_franja_libre_y_rechaza_solapada():
    existente = nueva(franja(10, 12))
    existente.confirmar()
    v = ValidadorDisponibilidadService(RepoFalso([existente]), ItemsFalso())
    v.verificar_item_disponible("item-1", franja(12, 14))  # contigua: libre
    with pytest.raises(FranjaOcupada):
        v.verificar_item_disponible("item-1", franja(11, 13))
    v.verificar_item_disponible("item-2", franja(11, 13))  # otro ítem: libre


def test_validador_ignora_reservas_canceladas():
    existente = nueva(franja(10, 12))
    existente.confirmar()
    existente.cancelar()
    v = ValidadorDisponibilidadService(RepoFalso([existente]), ItemsFalso())
    assert v.verificar_duplicidad_horarios("item-1", franja(10, 12)) is True


def test_validador_rechaza_item_no_reservable():
    v = ValidadorDisponibilidadService(RepoFalso(), ItemsFalso(reservable=False))
    with pytest.raises(ItemNoReservable):
        v.verificar_item_disponible("item-1", franja(10, 12))
