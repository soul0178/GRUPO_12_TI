"""Adaptador SQLAlchemy del puerto IUsuarioRepository."""
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError

from app.iam_usuarios.domain.errores import ConflictoConcurrencia, CorreoYaRegistrado
from app.iam_usuarios.domain.perfil import Perfil
from app.iam_usuarios.domain.repositorio import IUsuarioRepository
from app.iam_usuarios.domain.usuario import Usuario
from app.iam_usuarios.domain.value_objects import DatosContacto, EstadoCuenta, Rol
from app.iam_usuarios.infrastructure.modelos import PerfilModel, UsuarioModel


def _a_dominio(m: UsuarioModel) -> Usuario:
    p = m.perfil
    perfil = Perfil(
        p.perfil_id, p.nombres, p.apellidos, p.codigo_institucional,
        DatosContacto(p.telefono, p.direccion, p.correo_alterno),
    )
    return Usuario(
        m.usuario_id, m.correo_institucional, m.password_hash,
        Rol(m.rol), EstadoCuenta(m.estado_cuenta), perfil, version=m.version,
    )


class SqlUsuarioRepository(IUsuarioRepository):
    def __init__(self, db: Session) -> None:
        self._db = db

    def guardar(self, usuario: Usuario) -> None:
        m = self._db.get(UsuarioModel, usuario.usuario_id)
        if m is None:
            m = UsuarioModel(usuario_id=usuario.usuario_id, perfil=PerfilModel(
                perfil_id=usuario.perfil.perfil_id, usuario_id=usuario.usuario_id,
                nombres="", apellidos="",
            ))
            self._db.add(m)
        elif m.version != usuario.version:
            # Alguien guardó este usuario después de que lo leímos
            raise ConflictoConcurrencia("El usuario fue modificado por otra operación")

        m.correo_institucional = usuario.correo_institucional
        m.password_hash = usuario.password_hash
        m.rol = usuario.rol.value
        m.estado_cuenta = usuario.estado_cuenta.value
        p, c = usuario.perfil, usuario.perfil.contacto
        m.perfil.nombres, m.perfil.apellidos = p.nombres, p.apellidos
        m.perfil.codigo_institucional = p.codigo_institucional
        m.perfil.telefono, m.perfil.direccion = c.telefono, c.direccion
        m.perfil.correo_alterno = c.correo_alterno

        try:
            self._db.commit()
        except IntegrityError as exc:  # correo duplicado en una carrera
            self._db.rollback()
            raise CorreoYaRegistrado("El correo ya está registrado") from exc
        except StaleDataError as exc:
            self._db.rollback()
            raise ConflictoConcurrencia("El usuario fue modificado por otra operación") from exc
        usuario.version = m.version  # refleja la nueva versión

    def buscar_por_id(self, usuario_id: str) -> Usuario | None:
        m = self._db.get(UsuarioModel, usuario_id)
        return _a_dominio(m) if m else None

    def buscar_por_correo(self, correo: str) -> Usuario | None:
        m = self._db.scalar(
            select(UsuarioModel).where(UsuarioModel.correo_institucional == correo.strip().lower())
        )
        return _a_dominio(m) if m else None

    def listar(self) -> list[Usuario]:
        filas = self._db.scalars(
            select(UsuarioModel).order_by(UsuarioModel.correo_institucional)
        ).unique()
        return [_a_dominio(m) for m in filas]
