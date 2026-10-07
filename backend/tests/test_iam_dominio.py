"""Pruebas unitarias del dominio IAM (sin BD ni HTTP)."""
import pytest

from app.iam_usuarios.domain.errores import (
    DatosInvalidos, OperacionNoPermitida, TransicionCuentaInvalida,
)
from app.iam_usuarios.domain.usuario import Usuario
from app.iam_usuarios.domain.value_objects import DatosContacto, EstadoCuenta, Rol


def nuevo(rol=Rol.ESTUDIANTE):
    return Usuario.registrar("  Ana@UNSA.edu.pe ", "hash", rol, "Ana", "Pérez", "20240001")


def test_registrar_normaliza_correo_y_deja_cuenta_activa():
    u = nuevo()
    assert u.correo_institucional == "ana@unsa.edu.pe"
    assert u.estado_cuenta == EstadoCuenta.ACTIVA
    assert u.puede_solicitar_prestamos() is True


def test_correo_invalido_se_rechaza():
    with pytest.raises(DatosInvalidos):
        Usuario.registrar("no-es-correo", "hash", Rol.ESTUDIANTE, "Ana", "Pérez")


def test_nombres_vacios_se_rechazan():
    with pytest.raises(DatosInvalidos):
        Usuario.registrar("a@b.com", "hash", Rol.ESTUDIANTE, "  ", "Pérez")


def test_actualizar_perfil_reemplaza_contacto_completo():
    u = nuevo()
    u.actualizar_perfil("Ana María", "Pérez", None, DatosContacto("999", "Calle 1", "alt@x.com"))
    assert u.perfil.nombres == "Ana María"
    assert u.perfil.contacto.telefono == "999"


def test_actualizar_perfil_invalido_no_modifica_el_actual():
    u = nuevo()
    with pytest.raises(DatosInvalidos):
        u.actualizar_perfil("", "Pérez", None, DatosContacto())
    assert u.perfil.nombres == "Ana"


def test_correo_alterno_invalido_se_rechaza():
    with pytest.raises(DatosInvalidos):
        DatosContacto(correo_alterno="mal")


def test_suspender_y_reactivar_bloquean_y_habilitan_prestamos():  # RN-02
    u = nuevo()
    u.suspender("sancion-1")
    assert u.estado_cuenta == EstadoCuenta.SUSPENDIDA
    assert u.puede_solicitar_prestamos() is False
    u.reactivar()
    assert u.puede_solicitar_prestamos() is True


def test_transiciones_de_cuenta_invalidas_lanzan_error():
    u = nuevo()
    with pytest.raises(TransicionCuentaInvalida):
        u.reactivar()  # no está suspendida
    u.suspender("s")
    with pytest.raises(TransicionCuentaInvalida):
        u.suspender("s2")  # ya suspendida


def test_cambiar_rol_y_proteccion_contra_auto_cambio():
    u = nuevo()
    u.cambiar_rol("otro-admin", Rol.DOCENTE)
    assert u.rol == Rol.DOCENTE
    with pytest.raises(OperacionNoPermitida):
        u.cambiar_rol(u.usuario_id, Rol.ESTUDIANTE)
