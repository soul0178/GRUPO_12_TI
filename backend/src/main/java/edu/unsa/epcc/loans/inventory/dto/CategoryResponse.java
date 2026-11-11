package edu.unsa.epcc.loans.inventory.dto;

public record CategoryResponse(Long id, String name, int maxLoanHours, boolean requiresGuarantee) {
}
