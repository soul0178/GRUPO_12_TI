"""Crea (o verifica) el Administrador del Sistema.

Uso (desde backend/):
    python -m scripts.crear_admin --correo admin@unsa.edu.pe --password "ClaveSegura123" \
        --nombres Admin --apellidos Sistema
El registro público NUNCA crea administradores; este script es la vía segura.
"""
import argparse

from app.db_init import crear_tablas
from app.iam_usuarios.application.dtos import RegistroDTO
from app.iam_usuarios.application.usuario_app_service import UsuarioAppService
from app.iam_usuarios.domain.value_objects import Rol
from app.iam_usuarios.infrastructure.sql_usuario_repository import SqlUsuarioRepository
from app.shared.database import SessionLocal


def main() -> None:
    ap = argparse.ArgumentParser(description="Crear Administrador del Sistema")
    ap.add_argument("--correo", required=True)
    ap.add_argument("--password", required=True)
    ap.add_argument("--nombres", default="Administrador")
    ap.add_argument("--apellidos", default="del Sistema")
    a = ap.parse_args()

    crear_tablas()
    with SessionLocal() as db:
        servicio = UsuarioAppService(SqlUsuarioRepository(db))
        u = servicio.registrar(
            RegistroDTO(correo_institucional=a.correo, password=a.password,
                        nombres=a.nombres, apellidos=a.apellidos),
            rol=Rol.ADMINISTRADOR_SISTEMA,
        )
    print(f"Administrador creado: {u.correo_institucional}")


if __name__ == "__main__":
    main()
