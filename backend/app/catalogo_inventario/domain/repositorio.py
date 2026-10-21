"""Puerto: el dominio define la interfaz, la infraestructura la implementa."""
from abc import ABC, abstractmethod

from app.catalogo_inventario.domain.item_inventario import ItemInventario
from app.catalogo_inventario.domain.value_objects import TipoItem


class IItemRepository(ABC):
    @abstractmethod
    def guardar(self, item: ItemInventario) -> None: ...

    @abstractmethod
    def buscar_por_id(self, item_id: str) -> ItemInventario | None: ...

    @abstractmethod
    def buscar_por_codigo(self, codigo: str) -> ItemInventario | None: ...

    @abstractmethod
    def listar(
        self, tipo: TipoItem | None = None, incluir_bajas: bool = False
    ) -> list[ItemInventario]: ...
