"""Aggregate Root Usuario (informe 2.1.1).

Las reglas viven aquí; la capa de aplicación solo orquesta.
"""
import uuid

from app.iam_usuarios.domain.errores import OperacionNoPermitida, TransicionCuentaInvalida
from app.iam_usuarios.domain.perfil import Perfil
from app.iam_usuarios.domain.value_objects import (
    DatosContacto,
    EstadoCuenta,
    Rol,
    validar_correo,
)


class Usuario:
    def __init__(
        self,
        usuario_id: str,
        correo_institucional: str,
        password_hash: str,
        rol: Rol,
        estado_cuenta: EstadoCuenta,
        perfil: Perfil,
        version: int = 0,
    ) -> None:
        self.usuario_id = usuario_id
        self.correo_institucional = correo_institucional
        self.password_hash = password_hash  # opaco: el dominio no hashea
        self.rol = rol
        self.estado_cuenta = estado_cuenta
        self.perfil = perfil
        self.version = version  # bloqueo optimista (RNF-02)

    # ---- creación -------------------------------------------------
    @classmethod
    def registrar(
        cls, correo: str, password_hash: str, rol: Rol, nombres: str, apellidos: str,
        codigo_institucional: str | None = None,
    ) -> "Usuario":
        perfil = Perfil(str(uuid.uuid4()), nombres, apellidos, codigo_institucional)
        return cls(
            usuario_id=str(uuid.uuid4()),
            correo_institucional=validar_correo(correo),
            password_hash=password_hash,
            rol=rol,
            estado_cuenta=EstadoCuenta.ACTIVA,
            perfil=perfil,
        )

    # ---- operaciones ----------------------------------------------
    def actualizar_perfil(
        self, nombres: str, apellidos: str, codigo_institucional: str | None,
        contacto: DatosContacto,
    ) -> None:
        # Se valida construyendo un Perfil nuevo; si falla, el actual no cambia
        nuevo = Perfil(self.perfil.perfil_id, nombres, apellidos, codigo_institucional, contacto)
        self.perfil = nuevo

    def cambiar_rol(self, admin_id: str, nuevo_rol: Rol) -> None:
        # Que admin_id sea realmente ADMINISTRADOR_SISTEMA lo exige la capa
        # de presentación (RBAC); aquí se protege contra el auto-bloqueo.
        if admin_id == self.usuario_id:
            raise OperacionNoPermitida("Un administrador no puede cambiar su propio rol")
        self.rol = nuevo_rol

    def suspender(self, sancion_id: str) -> None:
        """Lo invocará SancionAplicada (Fase 5)."""
        if self.estado_cuenta != EstadoCuenta.ACTIVA:
            raise TransicionCuentaInvalida("Solo una cuenta ACTIVA puede suspenderse")
        self.estado_cuenta = EstadoCuenta.SUSPENDIDA

    def reactivar(self) -> None:
        """Lo invocará SancionCondonada (Fase 5)."""
        if self.estado_cuenta != EstadoCuenta.SUSPENDIDA:
            raise TransicionCuentaInvalida("Solo una cuenta SUSPENDIDA puede reactivarse")
        self.estado_cuenta = EstadoCuenta.ACTIVA

    def puede_solicitar_prestamos(self) -> bool:
        return self.estado_cuenta == EstadoCuenta.ACTIVA  # RN-02
