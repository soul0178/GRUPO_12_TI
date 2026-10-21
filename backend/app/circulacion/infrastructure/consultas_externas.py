"""Adaptadores de las consultas entre contextos.

Circulación NO importa el dominio de IAM ni de Catálogo: solo usa sus servicios
de aplicación por identificador, a través de los puertos IConsultaUsuarios/IConsultaItems.
"""
from app.catalogo_inventario.application.inventario_app_service import InventarioAppService
from app.catalogo_inventario.domain.value_objects import EstadoDisponibilidad
from app.circulacion.domain.repositorio import IConsultaItems, IConsultaUsuarios
from app.iam_usuarios.application.usuario_app_service import UsuarioAppService
from app.iam_usuarios.domain.value_objects import EstadoCuenta


class ConsultaUsuariosIAM(IConsultaUsuarios):
    def __init__(self, servicio: UsuarioAppService) -> None:
        self._servicio = servicio

    def puede_solicitar_prestamos(self, usuario_id: str) -> bool:
        # RN-02: solo una cuenta ACTIVA reserva o pide préstamos
        return self._servicio.obtener(usuario_id).estado_cuenta == EstadoCuenta.ACTIVA


class ConsultaItemsCatalogo(IConsultaItems):
    def __init__(self, servicio: InventarioAppService) -> None:
        self._servicio = servicio

    def es_reservable(self, item_id: str) -> bool:
        # obtener() lanza ItemNoEncontrado (404) si no existe
        item = self._servicio.obtener(item_id)
        return item.disponibilidad in (
            EstadoDisponibilidad.DISPONIBLE, EstadoDisponibilidad.PRESTADO
        )
