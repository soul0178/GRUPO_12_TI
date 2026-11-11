package edu.unsa.epcc.loans.sanction.dto;

public record PolicySettingsResponse(int maxActiveItems, int reservationExpirationMinutes) {
}
