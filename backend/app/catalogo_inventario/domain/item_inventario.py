"""Aggregate Root ItemInventario (informe 2.1.2, RF-03).

Las reglas viven aquí; la capa de aplicación solo orquesta.
"""
import uuid

from app.catalogo_inventario.domain.errores import DatosItemInvalidos, TransicionItemInvalida
from app.catalogo_inventario.domain.value_objects import (
    EstadoDisponibilidad,
    EstadoFisico,
    TipoItem,
)


def _validar_texto(valor: str, campo: str, maximo: int) -> str:
    valor = (valor or "").strip()
    if not valor:
        raise DatosItemInvalidos(f"{campo} es obligatorio")
    if len(valor) > maximo:
        raise DatosItemInvalidos(f"{campo} no puede superar {maximo} caracteres")
    return valor


class ItemInventario:
    def __init__(
        self,
        item_id: str,
        codigo: str,
        nombre: str,
        tipo: TipoItem,
        estado_fisico_actual: EstadoFisico,
        disponibilidad: EstadoDisponibilidad,
        descripcion: str = "",
        version: int = 0,
    ) -> None:
        self.item_id = item_id
        self.codigo = codigo
        self.nombre = nombre
        self.tipo = tipo
        self.estado_fisico_actual = estado_fisico_actual
        self.disponibilidad = disponibilidad
        self.descripcion = descripcion
        self.version = version  # bloqueo optimista (RNF-02)

    # ---- creación -------------------------------------------------
    @classmethod
    def registrar_alta(
        cls, admin_id: str, codigo: str, nombre: str, tipo: TipoItem,
        estado_fisico: EstadoFisico = EstadoFisico.BUENO, descripcion: str = "",
    ) -> "ItemInventario":
        """Un ítem recién dado de alta nace DISPONIBLE (o en mantenimiento si llega dañado)."""
        disponibilidad = (
            EstadoDisponibilidad.EN_MANTENIMIENTO
            if estado_fisico == EstadoFisico.DANADO
            else EstadoDisponibilidad.DISPONIBLE
        )
        return cls(
            item_id=str(uuid.uuid4()),
            codigo=_validar_texto(codigo, "El código", 30).upper(),
            nombre=_validar_texto(nombre, "El nombre", 120),
            tipo=tipo,
            estado_fisico_actual=estado_fisico,
            disponibilidad=disponibilidad,
            descripcion=(descripcion or "").strip()[:300],
        )

    # ---- operaciones ----------------------------------------------
    def modificar_detalles(
        self, admin_id: str, nombre: str, tipo: TipoItem, descripcion: str = ""
    ) -> None:
        self._exigir_no_baja()
        # Se valida antes de asignar: si falla, el ítem no cambia
        nuevo_nombre = _validar_texto(nombre, "El nombre", 120)
        self.nombre = nuevo_nombre
        self.tipo = tipo
        self.descripcion = (descripcion or "").strip()[:300]

    def registrar_baja(self, admin_id: str) -> None:
        self._exigir_no_baja()
        if self.disponibilidad == EstadoDisponibilidad.PRESTADO:
            raise TransicionItemInvalida("No se puede dar de baja un ítem que está prestado")
        self.disponibilidad = EstadoDisponibilidad.DADO_DE_BAJA

    def actualizar_estado_fisico(self, estado: EstadoFisico) -> None:
        """RF-07. Un ítem dañado pasa a mantenimiento; uno reparado vuelve a estar disponible."""
        self._exigir_no_baja()
        self.estado_fisico_actual = estado
        if estado == EstadoFisico.DANADO and self.disponibilidad == EstadoDisponibilidad.DISPONIBLE:
            self.disponibilidad = EstadoDisponibilidad.EN_MANTENIMIENTO
        elif estado != EstadoFisico.DANADO and self.disponibilidad == EstadoDisponibilidad.EN_MANTENIMIENTO:
            self.disponibilidad = EstadoDisponibilidad.DISPONIBLE

    def marcar_prestado(self) -> None:
        """Lo invocará PrestamoEntregado (Fase 4)."""
        if not self.esta_disponible_para_prestamo():
            raise TransicionItemInvalida("Solo un ítem DISPONIBLE puede prestarse")
        self.disponibilidad = EstadoDisponibilidad.PRESTADO

    def marcar_disponible(self) -> None:
        """Lo invocará PrestamoDevuelto (Fase 4)."""
        if self.disponibilidad != EstadoDisponibilidad.PRESTADO:
            raise TransicionItemInvalida("Solo un ítem PRESTADO puede volver a DISPONIBLE")
        self.disponibilidad = EstadoDisponibilidad.DISPONIBLE

    def esta_disponible_para_prestamo(self) -> bool:
        return (
            self.disponibilidad == EstadoDisponibilidad.DISPONIBLE
            and self.estado_fisico_actual != EstadoFisico.DANADO
        )

    def es_reservable(self) -> bool:
        """Se puede reservar a futuro aunque hoy esté prestado; no si está de baja o en mantenimiento."""
        return self.disponibilidad in (
            EstadoDisponibilidad.DISPONIBLE, EstadoDisponibilidad.PRESTADO
        )

    def _exigir_no_baja(self) -> None:
        if self.disponibilidad == EstadoDisponibilidad.DADO_DE_BAJA:
            raise TransicionItemInvalida("El ítem está dado de baja y no admite cambios")
