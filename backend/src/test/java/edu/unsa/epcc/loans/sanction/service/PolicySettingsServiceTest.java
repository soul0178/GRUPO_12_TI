package edu.unsa.epcc.loans.sanction.service;

import static org.assertj.core.api.Assertions.assertThat;

import edu.unsa.epcc.loans.sanction.dto.PolicySettingsResponse;
import edu.unsa.epcc.loans.sanction.dto.UpdatePolicySettingsRequest;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** Parámetros de política (RF-08): valores iniciales y edición. */
class PolicySettingsServiceTest extends IntegrationTestBase {

    @Autowired
    private PolicySettingsService settingsService;

    @Test
    void shouldStartWithThreeItemsAndThirtyMinutesAndAllowUpdatingThem() {
        PolicySettingsResponse initial = settingsService.get();
        assertThat(initial.maxActiveItems()).isEqualTo(3);
        assertThat(initial.reservationExpirationMinutes()).isEqualTo(30);

        try {
            PolicySettingsResponse updated = settingsService.update(new UpdatePolicySettingsRequest(5, 45));

            assertThat(updated.maxActiveItems()).isEqualTo(5);
            assertThat(settingsService.get().reservationExpirationMinutes()).isEqualTo(45);
        } finally {
            settingsService.update(new UpdatePolicySettingsRequest(initial.maxActiveItems(),
                    initial.reservationExpirationMinutes()));
        }
    }
}
