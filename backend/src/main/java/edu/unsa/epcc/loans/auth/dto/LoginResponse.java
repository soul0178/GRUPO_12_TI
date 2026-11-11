package edu.unsa.epcc.loans.auth.dto;

import edu.unsa.epcc.loans.user.dto.UserResponse;

public record LoginResponse(String token, UserResponse user) {
}
