from app.shared.event_bus import EventBus


def test_el_evento_llega_al_suscriptor():
    bus = EventBus()
    recibidos = []
    bus.suscribir("PrestamoDevuelto", recibidos.append)
    bus.publicar("PrestamoDevuelto", {"prestamoId": 1})
    assert recibidos == [{"prestamoId": 1}]
