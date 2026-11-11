package edu.unsa.epcc.loans.loan.dto;

import edu.unsa.epcc.loans.loan.entity.GuaranteeType;

public record GuaranteeResponse(GuaranteeType type, String description, boolean returned) {
}
