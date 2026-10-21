"""Repositorio SQLAlchemy de reservas contra SQLite en memoria."""
from datetime import datetime, timedelta

import pytest

from app.circulacion.domain.errores import ConflictoConcurrenciaReserva, FranjaOcupada
from app.circulacion.domain.reserva import Reserva
from app.circulacion.domain.value_objects import EstadoReserva, FranjaHoraria
from app.circulacion.infrastructure.sql_reserva_repository import SqlReservaRepository

AHORA = datetime(2026, 10, 21, 8, 0)


def franja(h_ini, h_fin, dia=22):
    return FranjaHoraria(datetime(2026, 10, dia, h_ini), datetime(2026, 10, dia, h_fin))


def reserva(f, usuario="u-1", item="i-1"):
    r = Reserva.crear(usuario, item, f, ahora=AHORA)
    r.confirmar()
    return r


def test_guardar_y_buscar_persiste_todo(db):
    repo = SqlReservaRepository(db)
    r = reserva(franja(10, 12))
    repo.guardar(r)
    leida = repo.buscar_por_id(r.reserva_id)
    assert leida.franja == r.franja and leida.estado == EstadoReserva.CONFIRMADA
    assert repo.buscar_por_id("no-existe") is None


def test_buscar_solapadas_respeta_contiguas_estados_e_items(db):
    repo = SqlReservaRepository(db)
    repo.guardar(reserva(franja(10, 12)))
    assert len(repo.buscar_solapadas("i-1", franja(11, 13))) == 1
    assert repo.buscar_solapadas("i-1", franja(12, 14)) == []  # contigua
    assert repo.buscar_solapadas("i-2", franja(11, 13)) == []  # otro ítem


def test_no_se_puede_guardar_una_reserva_solapada(db):
    repo = SqlReservaRepository(db)
    repo.guardar(reserva(franja(10, 12)))
    with pytest.raises(FranjaOcupada):
        repo.guardar(reserva(franja(11, 13), usuario="u-2"))  # RNF-02
    assert len(repo.listar_todas()) == 1


def test_cancelada_libera_el_horario(db):
    repo = SqlReservaRepository(db)
    r = reserva(franja(10, 12))
    repo.guardar(r)
    r.cancelar()
    repo.guardar(r)
    repo.guardar(reserva(franja(10, 12), usuario="u-2"))  # ya cabe
    assert len(repo.listar_por_item("i-1", AHORA, AHORA + timedelta(days=5))) == 1


def test_guardar_la_misma_reserva_no_choca_consigo_misma(db):
    repo = SqlReservaRepository(db)
    r = reserva(franja(10, 12))
    repo.guardar(r)
    repo.guardar(r)  # re-guardar sin cambios no es un solapamiento consigo misma
    assert len(repo.listar_todas()) == 1


def test_bloqueo_optimista_detecta_escritura_concurrente(db):
    repo = SqlReservaRepository(db)
    r = reserva(franja(10, 12))
    repo.guardar(r)
    a, b = repo.buscar_por_id(r.reserva_id), repo.buscar_por_id(r.reserva_id)
    a.cancelar()
    repo.guardar(a)
    b.expirar()
    with pytest.raises(ConflictoConcurrenciaReserva):
        repo.guardar(b)


def test_listados_por_usuario_y_vencidas(db):
    repo = SqlReservaRepository(db)
    repo.guardar(reserva(franja(10, 12), usuario="u-1"))
    repo.guardar(reserva(franja(14, 16), usuario="u-2"))
    assert [r.solicitante_id for r in repo.listar_por_usuario("u-1")] == ["u-1"]
    assert len(repo.listar_vencidas(datetime(2026, 10, 22, 13))) == 1  # solo la de 10-12
    assert len(repo.listar_vencidas(datetime(2026, 10, 22, 9))) == 0
