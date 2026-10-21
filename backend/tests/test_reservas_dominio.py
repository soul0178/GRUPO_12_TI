"""Pruebas unitarias del dominio de Reservas (sin BD ni HTTP)."""
from datetime import datetime, timedelta, timezone

import pytest

from app.circulacion.domain.errores import FranjaInvalida, TransicionReservaInvalida
from app.circulacion.domain.reserva import Reserva
from app.circulacion.domain.value_objects import EstadoReserva, FranjaHoraria

AHORA = datetime(2026, 10, 21, 8, 0)


def franja(h_ini, h_fin, dia=22):
    return FranjaHoraria(datetime(2026, 10, dia, h_ini), datetime(2026, 10, dia, h_fin))


def nueva(f=None):
    return Reserva.crear("u-1", "item-1", f or franja(10, 12), ahora=AHORA)


# ---- FranjaHoraria --------------------------------------------------
def test_franja_exige_fin_posterior_a_inicio():
    with pytest.raises(FranjaInvalida):
        franja(12, 12)
    with pytest.raises(FranjaInvalida):
        franja(12, 10)


def test_franjas_que_se_cruzan_se_solapan():
    assert franja(10, 12).solapa_con(franja(11, 13))
    assert franja(10, 12).solapa_con(franja(9, 11))
    assert franja(10, 14).solapa_con(franja(11, 12))  # contenida
    assert franja(11, 12).solapa_con(franja(10, 14))  # contiene


def test_franjas_contiguas_no_se_solapan():
    assert not franja(10, 12).solapa_con(franja(12, 14))
    assert not franja(12, 14).solapa_con(franja(10, 12))
    assert not franja(10, 12).solapa_con(franja(13, 14, dia=22))


def test_franja_normaliza_zona_horaria_a_utc():
    lima = timezone(timedelta(hours=-5))
    f = FranjaHoraria(datetime(2026, 10, 22, 10, tzinfo=lima), datetime(2026, 10, 22, 12, tzinfo=lima))
    assert f.inicio == datetime(2026, 10, 22, 15) and f.fin == datetime(2026, 10, 22, 17)
    assert f.duracion() == timedelta(hours=2)
    assert f.contiene(datetime(2026, 10, 22, 16)) and not f.contiene(datetime(2026, 10, 22, 17))


# ---- Reserva --------------------------------------------------------
def test_crear_deja_la_reserva_pendiente():
    r = nueva()
    assert r.estado == EstadoReserva.PENDIENTE and r.bloquea_horario()
    assert r.solicitante_id == "u-1" and r.item_id == "item-1"


def test_crear_rechaza_fechas_pasadas_o_inmediatas():
    with pytest.raises(FranjaInvalida):
        Reserva.crear("u", "i", FranjaHoraria(AHORA - timedelta(hours=1), AHORA + timedelta(hours=1)), ahora=AHORA)
    with pytest.raises(FranjaInvalida):
        Reserva.crear("u", "i", FranjaHoraria(AHORA, AHORA + timedelta(hours=1)), ahora=AHORA)


def test_crear_valida_duracion_minima_y_maxima():
    ini = AHORA + timedelta(days=1)
    with pytest.raises(FranjaInvalida):
        Reserva.crear("u", "i", FranjaHoraria(ini, ini + timedelta(minutes=5)), ahora=AHORA)
    with pytest.raises(FranjaInvalida):
        Reserva.crear("u", "i", FranjaHoraria(ini, ini + timedelta(hours=25)), ahora=AHORA)


def test_ciclo_pendiente_confirmada_cancelada():
    r = nueva()
    r.confirmar()
    assert r.estado == EstadoReserva.CONFIRMADA and r.bloquea_horario()
    r.cancelar()
    assert r.estado == EstadoReserva.CANCELADA and not r.bloquea_horario()


def test_expirar_desde_pendiente_o_confirmada():
    a, b = nueva(), nueva()
    b.confirmar()
    a.expirar()
    b.expirar()
    assert a.estado == b.estado == EstadoReserva.EXPIRADA


def test_marcar_convertida_exige_confirmada():
    r = nueva()
    with pytest.raises(TransicionReservaInvalida):
        r.marcar_convertida("p-1")
    r.confirmar()
    r.marcar_convertida("p-1")
    assert r.estado == EstadoReserva.CONVERTIDA and r.prestamo_id == "p-1"


def test_transiciones_invalidas_lanzan_error():
    r = nueva()
    r.confirmar()
    with pytest.raises(TransicionReservaInvalida):
        r.confirmar()  # ya confirmada
    r.cancelar()
    for operacion in (r.cancelar, r.expirar, r.confirmar):  # estados finales
        with pytest.raises(TransicionReservaInvalida):
            operacion()


def test_ya_paso_compara_con_el_fin_de_la_franja():
    r = nueva(franja(10, 12))
    assert not r.ya_paso(datetime(2026, 10, 22, 11))
    assert r.ya_paso(datetime(2026, 10, 22, 12))
