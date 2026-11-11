package edu.unsa.epcc.loans.common.exception;

/** Se lanza cuando se viola una regla de negocio (HTTP 409). El mensaje va en español. */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
