"""Adaptador SQLAlchemy del puerto IItemRepository."""
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError

from app.catalogo_inventario.domain.errores import CodigoItemDuplicado, ConflictoConcurrenciaItem
from app.catalogo_inventario.domain.item_inventario import ItemInventario
from app.catalogo_inventario.domain.repositorio import IItemRepository
from app.catalogo_inventario.domain.value_objects import (
    EstadoDisponibilidad,
    EstadoFisico,
    TipoItem,
)
from app.catalogo_inventario.infrastructure.modelos import ItemModel


def _a_dominio(m: ItemModel) -> ItemInventario:
    return ItemInventario(
        m.item_id, m.codigo, m.nombre, TipoItem(m.tipo),
        EstadoFisico(m.estado_fisico_actual), EstadoDisponibilidad(m.disponibilidad),
        descripcion=m.descripcion, version=m.version,
    )


class SqlItemRepository(IItemRepository):
    def __init__(self, db: Session) -> None:
        self._db = db

    def guardar(self, item: ItemInventario) -> None:
        m = self._db.get(ItemModel, item.item_id)
        if m is None:
            m = ItemModel(item_id=item.item_id)
            self._db.add(m)
        elif m.version != item.version:
            raise ConflictoConcurrenciaItem("El ítem fue modificado por otra operación")

        m.codigo = item.codigo
        m.nombre = item.nombre
        m.tipo = item.tipo.value
        m.estado_fisico_actual = item.estado_fisico_actual.value
        m.disponibilidad = item.disponibilidad.value
        m.descripcion = item.descripcion

        try:
            self._db.commit()
        except IntegrityError as exc:  # código duplicado en una carrera
            self._db.rollback()
            raise CodigoItemDuplicado("Ya existe un ítem con ese código") from exc
        except StaleDataError as exc:
            self._db.rollback()
            raise ConflictoConcurrenciaItem("El ítem fue modificado por otra operación") from exc
        item.version = m.version

    def buscar_por_id(self, item_id: str) -> ItemInventario | None:
        m = self._db.get(ItemModel, item_id)
        return _a_dominio(m) if m else None

    def buscar_por_codigo(self, codigo: str) -> ItemInventario | None:
        m = self._db.scalar(select(ItemModel).where(ItemModel.codigo == codigo.strip().upper()))
        return _a_dominio(m) if m else None

    def listar(
        self, tipo: TipoItem | None = None, incluir_bajas: bool = False
    ) -> list[ItemInventario]:
        consulta = select(ItemModel).order_by(ItemModel.nombre)
        if tipo is not None:
            consulta = consulta.where(ItemModel.tipo == tipo.value)
        if not incluir_bajas:
            consulta = consulta.where(
                ItemModel.disponibilidad != EstadoDisponibilidad.DADO_DE_BAJA.value
            )
        return [_a_dominio(m) for m in self._db.scalars(consulta)]
