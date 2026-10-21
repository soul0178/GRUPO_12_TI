from fastapi import Depends
from sqlalchemy.orm import Session

from app.catalogo_inventario.application.inventario_app_service import InventarioAppService
from app.catalogo_inventario.infrastructure.sql_item_repository import SqlItemRepository
from app.shared.database import get_db


def get_inventario_service(db: Session = Depends(get_db)) -> InventarioAppService:
    return InventarioAppService(SqlItemRepository(db))
