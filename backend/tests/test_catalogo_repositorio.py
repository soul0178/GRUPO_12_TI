"""Repositorio SQLAlchemy del catálogo contra SQLite en memoria."""
import pytest

from app.catalogo_inventario.domain.errores import ConflictoConcurrenciaItem
from app.catalogo_inventario.domain.item_inventario import ItemInventario
from app.catalogo_inventario.domain.value_objects import EstadoDisponibilidad, TipoItem
from app.catalogo_inventario.infrastructure.sql_item_repository import SqlItemRepository


def crear(codigo="LAP-001", tipo=TipoItem.EQUIPO, nombre="Laptop"):
    return ItemInventario.registrar_alta("adm", codigo, nombre, tipo)


def test_guardar_y_buscar_persiste_todo(db):
    repo = SqlItemRepository(db)
    i = crear()
    repo.guardar(i)
    leido = repo.buscar_por_codigo("lap-001")
    assert leido.item_id == i.item_id and leido.tipo == TipoItem.EQUIPO
    assert repo.buscar_por_id("no-existe") is None


def test_version_se_incrementa_en_cada_guardado(db):
    repo = SqlItemRepository(db)
    i = crear()
    repo.guardar(i)
    v1 = i.version
    i.marcar_prestado()
    repo.guardar(i)
    assert i.version == v1 + 1


def test_bloqueo_optimista_detecta_escritura_concurrente(db):
    repo = SqlItemRepository(db)
    i = crear()
    repo.guardar(i)
    a, b = repo.buscar_por_id(i.item_id), repo.buscar_por_id(i.item_id)
    a.marcar_prestado()
    repo.guardar(a)
    b.modificar_detalles("adm", "Otro nombre", TipoItem.EQUIPO)
    with pytest.raises(ConflictoConcurrenciaItem):
        repo.guardar(b)


def test_listar_filtra_por_tipo_y_oculta_bajas(db):
    repo = SqlItemRepository(db)
    repo.guardar(crear("LAP-001", TipoItem.EQUIPO, "Laptop"))
    repo.guardar(crear("LIB-001", TipoItem.LIBRO, "Cálculo I"))
    baja = crear("OBJ-001", TipoItem.OBJETO, "Proyector viejo")
    repo.guardar(baja)
    baja.registrar_baja("adm")
    repo.guardar(baja)

    assert {i.codigo for i in repo.listar()} == {"LAP-001", "LIB-001"}
    assert [i.codigo for i in repo.listar(tipo=TipoItem.LIBRO)] == ["LIB-001"]
    assert len(repo.listar(incluir_bajas=True)) == 3
    assert repo.buscar_por_codigo("OBJ-001").disponibilidad == EstadoDisponibilidad.DADO_DE_BAJA
