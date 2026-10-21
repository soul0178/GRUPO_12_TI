from fastapi import Depends
from sqlalchemy.orm import Session

from app.catalogo_inventario.application.inventario_app_service import InventarioAppService
from app.catalogo_inventario.presentation.dependencias import get_inventario_service
from app.circulacion.application.reserva_app_service import ReservaAppService
from app.circulacion.domain.validador_disponibilidad import ValidadorDisponibilidadService
from app.circulacion.infrastructure.consultas_externas import (
    ConsultaItemsCatalogo, ConsultaUsuariosIAM,
)
from app.circulacion.infrastructure.sql_reserva_repository import SqlReservaRepository
from app.iam_usuarios.application.usuario_app_service import UsuarioAppService
from app.iam_usuarios.presentation.dependencias import get_usuario_service
from app.shared.database import get_db


def get_reserva_service(
    db: Session = Depends(get_db),
    usuarios: UsuarioAppService = Depends(get_usuario_service),
    inventario: InventarioAppService = Depends(get_inventario_service),
) -> ReservaAppService:
    repo = SqlReservaRepository(db)
    validador = ValidadorDisponibilidadService(repo, ConsultaItemsCatalogo(inventario))
    return ReservaAppService(repo, ConsultaUsuariosIAM(usuarios), validador)
