package edu.unsa.epcc.loans.common.dto;

import java.util.List;
import org.springframework.data.domain.Page;

/** Respuesta paginada genérica de los listados de la API. */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    /** Convierte una página de Spring Data en la respuesta de la API. */
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
