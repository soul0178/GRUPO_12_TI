package edu.unsa.epcc.loans.sanction.controller;

import edu.unsa.epcc.loans.sanction.dto.PolicySettingsResponse;
import edu.unsa.epcc.loans.sanction.dto.UpdatePolicySettingsRequest;
import edu.unsa.epcc.loans.sanction.service.PolicySettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Parámetros de política: los consulta cualquier usuario y los edita solo un ADMIN (RF-08). */
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class PolicySettingsController {

    private final PolicySettingsService settingsService;

    /** Devuelve los parámetros de política vigentes. */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public PolicySettingsResponse get() {
        return settingsService.get();
    }

    /** Actualiza los parámetros de política. */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PolicySettingsResponse update(@Valid @RequestBody UpdatePolicySettingsRequest request) {
        return settingsService.update(request);
    }
}
