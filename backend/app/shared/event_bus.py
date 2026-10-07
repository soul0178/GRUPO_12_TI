"""Bus de eventos en memoria (esqueleto de la Fase 0; se usa desde la Fase 4).

Permite que los contextos reaccionen entre sí sin acoplarse (informe 2.4).
"""
from collections import defaultdict
from collections.abc import Callable
from typing import Any

Handler = Callable[[Any], None]


class EventBus:
    def __init__(self) -> None:
        self._handlers: dict[str, list[Handler]] = defaultdict(list)

    def suscribir(self, tipo_evento: str, handler: Handler) -> None:
        self._handlers[tipo_evento].append(handler)

    def publicar(self, tipo_evento: str, evento: Any) -> None:
        for handler in self._handlers[tipo_evento]:
            handler(evento)
