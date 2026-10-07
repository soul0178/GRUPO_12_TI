"""Casos de uso de IAM. Orquesta; las reglas de negocio están en el dominio."""
from app.iam_usuarios.application.dtos import (
    LoginDTO, PerfilDTO, RegistroDTO, TokenDTO, UsuarioDTO,
)
from app.iam_usuarios.domain.errores import (
    CorreoYaRegistrado, CredencialesInvalidas, CuentaInactiva, UsuarioNoEncontrado,
)
from app.iam_usuarios.domain.repositorio import IUsuarioRepository
from app.iam_usuarios.domain.usuario import Usuario
from app.iam_usuarios.domain.value_objects import DatosContacto, EstadoCuenta, Rol
from app.shared import seguridad


def _a_dto(u: Usuario) -> UsuarioDTO:
    p, c = u.perfil, u.perfil.contacto
    return UsuarioDTO(
        usuario_id=u.usuario_id, correo_institucional=u.correo_institucional,
        rol=u.rol, estado_cuenta=u.estado_cuenta,
        perfil=PerfilDTO(
            nombres=p.nombres, apellidos=p.apellidos,
            codigo_institucional=p.codigo_institucional,
            telefono=c.telefono, direccion=c.direccion, correo_alterno=c.correo_alterno,
        ),
    )


class UsuarioAppService:
    def __init__(self, repo: IUsuarioRepository) -> None:
        self._repo = repo

    def registrar(self, dto: RegistroDTO, rol: Rol = Rol.ESTUDIANTE) -> UsuarioDTO:
        # `rol` NO viene del DTO público: el registro abierto siempre crea ESTUDIANTE.
        # Solo el script semilla o un administrador pueden asignar otro rol.
        usuario = Usuario.registrar(
            correo=dto.correo_institucional,
            password_hash=seguridad.hashear_password(dto.password),
            rol=rol, nombres=dto.nombres, apellidos=dto.apellidos,
            codigo_institucional=dto.codigo_institucional,
        )
        if self._repo.buscar_por_correo(usuario.correo_institucional):
            raise CorreoYaRegistrado("El correo ya está registrado")
        self._repo.guardar(usuario)
        return _a_dto(usuario)

    def login(self, dto: LoginDTO) -> TokenDTO:
        usuario = self._repo.buscar_por_correo(dto.correo_institucional)
        # Siempre se verifica un hash (real o de relleno) para tiempos parejos
        hash_a_usar = usuario.password_hash if usuario else seguridad.HASH_FALSO
        ok = seguridad.verificar_password(dto.password, hash_a_usar)
        if not usuario or not ok:
            raise CredencialesInvalidas("Correo o contraseña incorrectos")
        if usuario.estado_cuenta == EstadoCuenta.INACTIVA:
            raise CuentaInactiva("La cuenta está inactiva")
        # SUSPENDIDA sí puede iniciar sesión: RN-02 solo le impide reservar/prestar
        return TokenDTO(access_token=seguridad.crear_token(usuario.usuario_id, usuario.rol.value))

    def obtener(self, usuario_id: str) -> UsuarioDTO:
        return _a_dto(self._buscar(usuario_id))

    def actualizar_perfil(self, usuario_id: str, dto: PerfilDTO) -> UsuarioDTO:
        usuario = self._buscar(usuario_id)
        usuario.actualizar_perfil(
            dto.nombres, dto.apellidos, dto.codigo_institucional,
            DatosContacto(dto.telefono, dto.direccion, dto.correo_alterno),
        )
        self._repo.guardar(usuario)
        return _a_dto(usuario)

    def listar(self) -> list[UsuarioDTO]:
        return [_a_dto(u) for u in self._repo.listar()]

    def cambiar_rol(self, admin_id: str, usuario_id: str, nuevo_rol: Rol) -> UsuarioDTO:
        usuario = self._buscar(usuario_id)
        usuario.cambiar_rol(admin_id, nuevo_rol)
        self._repo.guardar(usuario)
        return _a_dto(usuario)

    def _buscar(self, usuario_id: str) -> Usuario:
        usuario = self._repo.buscar_por_id(usuario_id)
        if usuario is None:
            raise UsuarioNoEncontrado("Usuario no encontrado")
        return usuario
