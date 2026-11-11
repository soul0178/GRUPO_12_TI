package edu.unsa.epcc.loans.common.exception;

/** Se lanza cuando no existe el recurso pedido (HTTP 404). El mensaje va en español. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
