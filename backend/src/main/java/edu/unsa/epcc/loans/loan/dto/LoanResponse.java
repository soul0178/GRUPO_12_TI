package edu.unsa.epcc.loans.loan.dto;

import edu.unsa.epcc.loans.loan.entity.LoanStatus;
import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import java.time.Instant;

public record LoanResponse(
        Long id,
        Long userId,
        String userFullName,
        String userEmail,
        Long itemId,
        String itemCode,
        String itemName,
        String categoryName,
        String deliveredByName,
        String returnedByName,
        Instant checkedOutAt,
        Instant dueAt,
        Instant returnedAt,
        PhysicalCondition deliveryCondition,
        PhysicalCondition returnCondition,
        String deliveryObservations,
        String returnObservations,
        LoanStatus status,
        GuaranteeResponse guarantee) {
}
