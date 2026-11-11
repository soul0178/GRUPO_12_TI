package edu.unsa.epcc.loans.sanction.mapper;

import edu.unsa.epcc.loans.sanction.dto.PolicySettingsResponse;
import edu.unsa.epcc.loans.sanction.dto.UpdatePolicySettingsRequest;
import edu.unsa.epcc.loans.sanction.entity.PolicySettings;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

/** Convierte entre PolicySettings y sus DTOs. */
@Mapper(componentModel = "spring")
public interface PolicySettingsMapper {

    PolicySettingsResponse toResponse(PolicySettings settings);

    void update(UpdatePolicySettingsRequest request, @MappingTarget PolicySettings settings);
}
