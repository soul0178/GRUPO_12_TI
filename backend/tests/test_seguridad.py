import pytest

from app.shared import seguridad
from app.shared.errores import ErrorNoAutenticado


def test_hash_no_guarda_texto_plano_y_se_verifica():
    h = seguridad.hashear_password("Clave12345")
    assert h != "Clave12345"
    assert seguridad.verificar_password("Clave12345", h)
    assert not seguridad.verificar_password("otra", h)


def test_token_ida_y_vuelta():
    datos = seguridad.decodificar_token(seguridad.crear_token("u-1", "DOCENTE"))
    assert datos["sub"] == "u-1" and datos["rol"] == "DOCENTE"


def test_token_manipulado_se_rechaza():
    with pytest.raises(ErrorNoAutenticado):
        seguridad.decodificar_token(seguridad.crear_token("u-1", "DOCENTE") + "x")
