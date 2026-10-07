"""Puerto: el dominio define la interfaz, la infraestructura la implementa."""
from abc import ABC, abstractmethod

from app.iam_usuarios.domain.usuario import Usuario


class IUsuarioRepository(ABC):
    @abstractmethod
    def guardar(self, usuario: Usuario) -> None: ...

    @abstractmethod
    def buscar_por_id(self, usuario_id: str) -> Usuario | None: ...

    @abstractmethod
    def buscar_por_correo(self, correo: str) -> Usuario | None: ...

    @abstractmethod
    def listar(self) -> list[Usuario]: ...
