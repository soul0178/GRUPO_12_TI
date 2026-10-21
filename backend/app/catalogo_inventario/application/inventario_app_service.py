"""Casos de uso del catálogo. Orquesta; las reglas están en el dominio."""
from app.catalogo_inventario.application.dtos import (
    ItemDTO, ItemRespuestaDTO, ModificarItemDTO,
)
from app.catalogo_inventario.domain.errores import CodigoItemDuplicado, ItemNoEncontrado
from app.catalogo_inventario.domain.item_inventario import ItemInventario
from app.catalogo_inventario.domain.repositorio import IItemRepository
from app.catalogo_inventario.domain.value_objects import EstadoFisico, TipoItem


def a_dto(i: ItemInventario) -> ItemRespuestaDTO:
    return ItemRespuestaDTO(
        item_id=i.item_id, codigo=i.codigo, nombre=i.nombre, tipo=i.tipo,
        estado_fisico_actual=i.estado_fisico_actual, disponibilidad=i.disponibilidad,
        descripcion=i.descripcion,
    )


class InventarioAppService:
    def __init__(self, repo: IItemRepository) -> None:
        self._repo = repo

    def alta(self, admin_id: str, dto: ItemDTO) -> ItemRespuestaDTO:
        item = ItemInventario.registrar_alta(
            admin_id, dto.codigo, dto.nombre, dto.tipo, dto.estado_fisico, dto.descripcion
        )
        if self._repo.buscar_por_codigo(item.codigo):
            raise CodigoItemDuplicado("Ya existe un ítem con ese código")
        self._repo.guardar(item)
        return a_dto(item)

    def modificar(self, admin_id: str, item_id: str, dto: ModificarItemDTO) -> ItemRespuestaDTO:
        item = self._buscar(item_id)
        item.modificar_detalles(admin_id, dto.nombre, dto.tipo, dto.descripcion)
        self._repo.guardar(item)
        return a_dto(item)

    def baja(self, admin_id: str, item_id: str) -> ItemRespuestaDTO:
        item = self._buscar(item_id)
        item.registrar_baja(admin_id)
        self._repo.guardar(item)
        return a_dto(item)

    def actualizar_estado_fisico(self, item_id: str, estado: EstadoFisico) -> ItemRespuestaDTO:
        item = self._buscar(item_id)
        item.actualizar_estado_fisico(estado)
        self._repo.guardar(item)
        return a_dto(item)

    def obtener(self, item_id: str) -> ItemRespuestaDTO:
        return a_dto(self._buscar(item_id))

    def listar(
        self, tipo: TipoItem | None = None, incluir_bajas: bool = False
    ) -> list[ItemRespuestaDTO]:
        return [a_dto(i) for i in self._repo.listar(tipo, incluir_bajas)]

    def _buscar(self, item_id: str) -> ItemInventario:
        item = self._repo.buscar_por_id(item_id)
        if item is None:
            raise ItemNoEncontrado("Ítem no encontrado")
        return item
