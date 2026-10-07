"""Modelos ORM (tablas). Son detalle de infraestructura, no dominio."""
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.database import Base


class PerfilModel(Base):
    __tablename__ = "perfiles"

    perfil_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    usuario_id: Mapped[str] = mapped_column(ForeignKey("usuarios.usuario_id"), unique=True)
    nombres: Mapped[str] = mapped_column(String(100))
    apellidos: Mapped[str] = mapped_column(String(100))
    codigo_institucional: Mapped[str | None] = mapped_column(String(30), nullable=True)
    telefono: Mapped[str] = mapped_column(String(30), default="")
    direccion: Mapped[str] = mapped_column(String(200), default="")
    correo_alterno: Mapped[str] = mapped_column(String(120), default="")


class UsuarioModel(Base):
    __tablename__ = "usuarios"

    usuario_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    correo_institucional: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    rol: Mapped[str] = mapped_column(String(30))
    estado_cuenta: Mapped[str] = mapped_column(String(20))
    version: Mapped[int] = mapped_column(Integer, nullable=False)

    perfil: Mapped[PerfilModel] = relationship(
        uselist=False, cascade="all, delete-orphan", lazy="joined"
    )

    # SQLAlchemy incrementa `version` en cada UPDATE y falla si otra
    # transacción lo cambió antes (bloqueo optimista, RNF-02)
    __mapper_args__ = {"version_id_col": version}
