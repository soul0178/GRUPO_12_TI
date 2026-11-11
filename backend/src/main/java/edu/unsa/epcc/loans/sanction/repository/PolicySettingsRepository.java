package edu.unsa.epcc.loans.sanction.repository;

import edu.unsa.epcc.loans.sanction.entity.PolicySettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicySettingsRepository extends JpaRepository<PolicySettings, Long> {
}
