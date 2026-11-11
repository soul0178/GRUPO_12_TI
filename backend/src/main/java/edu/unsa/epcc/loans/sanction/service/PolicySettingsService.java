package edu.unsa.epcc.loans.sanction.service;

import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.sanction.dto.PolicySettingsResponse;
import edu.unsa.epcc.loans.sanction.dto.UpdatePolicySettingsRequest;
import edu.unsa.epcc.loans.sanction.entity.PolicySettings;
import edu.unsa.epcc.loans.sanction.mapper.PolicySettingsMapper;
import edu.unsa.epcc.loans.sanction.repository.PolicySettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Lee y edita los parámetros de política (límite de ítems activos, expiración de reservas) (RF-08). */
@Slf4j
@Service
@RequiredArgsConstructor
public class PolicySettingsService {

    /** La tabla policy_settings tiene una sola fila con este id. */
    private static final long SETTINGS_ID = 1L;

    private final PolicySettingsRepository settingsRepository;
    private final PolicySettingsMapper settingsMapper;

    /** Devuelve los parámetros vigentes; los módulos de préstamos y reservas los consultan aquí. */
    @Transactional(readOnly = true)
    public PolicySettingsResponse get() {
        return settingsMapper.toResponse(getSettings());
    }

    /** Actualiza los parámetros de política (ADMIN). */
    @Transactional
    public PolicySettingsResponse update(UpdatePolicySettingsRequest request) {
        PolicySettings settings = getSettings();
        settingsMapper.update(request, settings);
        log.info("Políticas actualizadas: máximo de ítems={}, expiración de reservas={} min",
                settings.getMaxActiveItems(), settings.getReservationExpirationMinutes());
        return settingsMapper.toResponse(settings);
    }

    private PolicySettings getSettings() {
        return settingsRepository.findById(SETTINGS_ID)
                .orElseThrow(() -> new NotFoundException("No se encontraron los parámetros de política"));
    }
}
