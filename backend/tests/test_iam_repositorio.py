"""Repositorio SQLAlchemy contra SQLite en memoria."""
import pytest

from app.iam_usuarios.domain.errores import ConflictoConcurrencia
from app.iam_usuarios.domain.usuario import Usuario
from app.iam_usuarios.domain.value_objects import Rol
from app.iam_usuarios.infrastructure.sql_usuario_repository import SqlUsuarioRepository


def crear(correo="ana@unsa.edu.pe"):
    return Usuario.registrar(correo, "hash", Rol.ESTUDIANTE, "Ana", "Pérez", "20240001")


def test_guardar_y_buscar_persiste_todo(db):
    repo = SqlUsuarioRepository(db)
    u = crear()
    repo.guardar(u)
    leido = repo.buscar_por_correo("ANA@unsa.edu.pe")
    assert leido.usuario_id == u.usuario_id
    assert leido.perfil.codigo_institucional == "20240001"
    assert repo.buscar_por_id("no-existe") is None


def test_version_se_incrementa_en_cada_guardado(db):
    repo = SqlUsuarioRepository(db)
    u = crear()
    repo.guardar(u)
    v1 = u.version
    u.suspender("s")
    repo.guardar(u)
    assert u.version == v1 + 1


def test_bloqueo_optimista_detecta_escritura_concurrente(db):
    repo = SqlUsuarioRepository(db)
    u = crear()
    repo.guardar(u)
    copia_a = repo.buscar_por_id(u.usuario_id)
    copia_b = repo.buscar_por_id(u.usuario_id)
    copia_a.suspender("s")
    repo.guardar(copia_a)  # gana la primera
    copia_b.cambiar_rol("admin", Rol.DOCENTE)
    with pytest.raises(ConflictoConcurrencia):
        repo.guardar(copia_b)  # la segunda trabajaba con una versión vieja
