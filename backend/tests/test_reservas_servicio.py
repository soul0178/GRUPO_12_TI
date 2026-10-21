"""Caso de uso ReservaAppService con BD en memoria y reloj fijo."""
from datetime import datetime

import pytest

from app.circulacion.application.dtos import ReservaDTO
from app.circulacion.application.reserva_app_service import ReservaAppService
from app.circulacion.domain.errores import (
    FranjaOcupada, ReservaAjena, ReservaNoEncontrada, UsuarioNoPuedeReservar,
)
from app.circulacion.domain.repositorio import IConsultaItems, IConsultaUsuarios
from app.circulacion.domain.reserva import Reserva
from app.circulacion.domain.validador_disponibilidad import ValidadorDisponibilidadService
from app.circulacion.domain.value_objects import EstadoReserva, FranjaHoraria
from app.circulacion.infrastructure.sql_reserva_repository import SqlReservaRepository

AHORA = datetime(2026, 10, 21, 8, 0)


def franja(h_ini, h_fin, dia=22):
    return FranjaHoraria(datetime(2026, 10, dia, h_ini), datetime(2026, 10, dia, h_fin))


def reserva(f, usuario="u-1", item="i-1"):
    r = Reserva.crear(usuario, item, f, ahora=AHORA)
    r.confirmar()
    return r


class UsuariosFalso(IConsultaUsuarios):
    def __init__(self, activo=True):
        self.activo = activo

    def puede_solicitar_prestamos(self, usuario_id):
        return self.activo


class ItemsFalso(IConsultaItems):
    def es_reservable(self, item_id):
        return True


def servicio(db, activo=True):
    repo = SqlReservaRepository(db)
    return ReservaAppService(
        repo, UsuariosFalso(activo), ValidadorDisponibilidadService(repo, ItemsFalso()),
        reloj=lambda: AHORA,
    )


def dto(h_ini, h_fin, item="i-1"):
    return ReservaDTO(item_id=item, inicio=datetime(2026, 10, 22, h_ini), fin=datetime(2026, 10, 22, h_fin))


def test_procesar_reserva_devuelve_confirmada(db):
    r = servicio(db).procesar_reserva("u-1", dto(10, 12))
    assert r.estado == EstadoReserva.CONFIRMADA and r.solicitante_id == "u-1"


def test_usuario_suspendido_no_puede_reservar(db):  # RN-02
    with pytest.raises(UsuarioNoPuedeReservar):
        servicio(db, activo=False).procesar_reserva("u-1", dto(10, 12))


def test_segunda_reserva_en_el_mismo_horario_es_rechazada(db):  # RNF-02
    s = servicio(db)
    s.procesar_reserva("u-1", dto(10, 12))
    with pytest.raises(FranjaOcupada):
        s.procesar_reserva("u-2", dto(11, 13))
    s.procesar_reserva("u-2", dto(12, 14))  # contigua: sí


def test_cancelar_solo_el_dueno_o_el_admin(db):
    s = servicio(db)
    r = s.procesar_reserva("u-1", dto(10, 12))
    with pytest.raises(ReservaAjena):
        s.cancelar(r.reserva_id, "u-2")
    assert s.cancelar(r.reserva_id, "admin", es_admin=True).estado == EstadoReserva.CANCELADA
    with pytest.raises(ReservaNoEncontrada):
        s.cancelar("no-existe", "u-1")


def test_expirar_vencidas_marca_solo_las_que_ya_pasaron(db):
    repo = SqlReservaRepository(db)
    repo.guardar(reserva(franja(10, 12)))
    repo.guardar(reserva(franja(14, 16), usuario="u-2"))
    s = ReservaAppService(
        repo, UsuariosFalso(), ValidadorDisponibilidadService(repo, ItemsFalso()),
        reloj=lambda: datetime(2026, 10, 22, 13),
    )
    assert s.expirar_vencidas() == 1
    estados = {r.estado for r in repo.listar_todas()}
    assert estados == {EstadoReserva.EXPIRADA, EstadoReserva.CONFIRMADA}
    assert s.expirar_vencidas() == 0  # idempotente


def test_disponibilidad_lista_solo_franjas_vigentes(db):
    s = servicio(db)
    a = s.procesar_reserva("u-1", dto(10, 12))
    s.procesar_reserva("u-2", dto(14, 16))
    s.cancelar(a.reserva_id, "u-1")
    libres = s.disponibilidad("i-1")
    assert [(f.inicio.hour, f.fin.hour) for f in libres] == [(14, 16)]
