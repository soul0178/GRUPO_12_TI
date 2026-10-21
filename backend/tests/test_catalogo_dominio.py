"""Pruebas unitarias del dominio Catálogo (sin BD ni HTTP)."""
import pytest

from app.catalogo_inventario.domain.errores import DatosItemInvalidos, TransicionItemInvalida
from app.catalogo_inventario.domain.item_inventario import ItemInventario
from app.catalogo_inventario.domain.value_objects import (
    EstadoDisponibilidad, EstadoFisico, TipoItem,
)


def nuevo(**kw):
    datos = dict(admin_id="adm", codigo=" lap-001 ", nombre="Laptop", tipo=TipoItem.EQUIPO)
    datos.update(kw)
    return ItemInventario.registrar_alta(**datos)


def test_alta_normaliza_codigo_y_deja_item_disponible():
    i = nuevo()
    assert i.codigo == "LAP-001"
    assert i.disponibilidad == EstadoDisponibilidad.DISPONIBLE
    assert i.estado_fisico_actual == EstadoFisico.BUENO
    assert i.esta_disponible_para_prestamo() is True


def test_alta_de_item_danado_nace_en_mantenimiento():
    i = nuevo(estado_fisico=EstadoFisico.DANADO)
    assert i.disponibilidad == EstadoDisponibilidad.EN_MANTENIMIENTO
    assert i.esta_disponible_para_prestamo() is False


@pytest.mark.parametrize("campo", ["codigo", "nombre"])
def test_alta_rechaza_codigo_o_nombre_vacio(campo):
    with pytest.raises(DatosItemInvalidos):
        nuevo(**{campo: "   "})


def test_modificar_detalles_cambia_nombre_tipo_y_descripcion():
    i = nuevo()
    i.modificar_detalles("adm", "Laptop HP", TipoItem.OBJETO, "con cargador")
    assert (i.nombre, i.tipo, i.descripcion) == ("Laptop HP", TipoItem.OBJETO, "con cargador")


def test_modificar_invalido_no_cambia_el_item():
    i = nuevo()
    with pytest.raises(DatosItemInvalidos):
        i.modificar_detalles("adm", "  ", TipoItem.LIBRO)
    assert i.nombre == "Laptop" and i.tipo == TipoItem.EQUIPO


def test_marcar_prestado_y_disponible():
    i = nuevo()
    i.marcar_prestado()
    assert i.disponibilidad == EstadoDisponibilidad.PRESTADO
    assert i.esta_disponible_para_prestamo() is False
    i.marcar_disponible()
    assert i.disponibilidad == EstadoDisponibilidad.DISPONIBLE


def test_no_se_puede_prestar_dos_veces_ni_devolver_lo_no_prestado():
    i = nuevo()
    with pytest.raises(TransicionItemInvalida):
        i.marcar_disponible()
    i.marcar_prestado()
    with pytest.raises(TransicionItemInvalida):
        i.marcar_prestado()


def test_estado_fisico_danado_envia_a_mantenimiento_y_reparado_lo_libera():  # RF-07
    i = nuevo()
    i.actualizar_estado_fisico(EstadoFisico.DANADO)
    assert i.disponibilidad == EstadoDisponibilidad.EN_MANTENIMIENTO
    i.actualizar_estado_fisico(EstadoFisico.REGULAR)
    assert i.disponibilidad == EstadoDisponibilidad.DISPONIBLE


def test_baja_es_definitiva_y_bloquea_cambios():
    i = nuevo()
    i.registrar_baja("adm")
    assert i.disponibilidad == EstadoDisponibilidad.DADO_DE_BAJA
    for operacion in (
        lambda: i.registrar_baja("adm"),
        lambda: i.modificar_detalles("adm", "X", TipoItem.LIBRO),
        lambda: i.actualizar_estado_fisico(EstadoFisico.BUENO),
        lambda: i.marcar_prestado(),
    ):
        with pytest.raises(TransicionItemInvalida):
            operacion()


def test_no_se_da_de_baja_un_item_prestado():
    i = nuevo()
    i.marcar_prestado()
    with pytest.raises(TransicionItemInvalida):
        i.registrar_baja("adm")


def test_es_reservable_segun_disponibilidad():
    i = nuevo()
    assert i.es_reservable()
    i.marcar_prestado()
    assert i.es_reservable()  # prestado hoy, reservable a futuro
    i.marcar_disponible()
    i.actualizar_estado_fisico(EstadoFisico.DANADO)
    assert not i.es_reservable()
