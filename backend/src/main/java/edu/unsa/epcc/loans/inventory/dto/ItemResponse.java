package edu.unsa.epcc.loans.inventory.dto;

import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import java.time.Instant;

public record ItemResponse(
        Long id,
        String code,
        String name,
        String description,
        CategoryResponse category,
        ItemStatus status,
        Instant createdAt) {
}
