package edu.unsa.epcc.loans.sanction.dto;

import edu.unsa.epcc.loans.sanction.entity.SanctionStatus;
import edu.unsa.epcc.loans.sanction.entity.SanctionType;
import java.time.Instant;

public record SanctionResponse(
        Long id,
        Long userId,
        String userFullName,
        String userEmail,
        SanctionType type,
        SanctionStatus status,
        Instant startAt,
        Instant endAt,
        String reason,
        Long loanId,
        Instant createdAt) {
}
