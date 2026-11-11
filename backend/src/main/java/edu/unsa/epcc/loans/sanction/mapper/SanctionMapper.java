package edu.unsa.epcc.loans.sanction.mapper;

import edu.unsa.epcc.loans.sanction.dto.SanctionResponse;
import edu.unsa.epcc.loans.sanction.entity.Sanction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** Convierte la entidad Sanction en su DTO, incluyendo los datos básicos del usuario sancionado. */
@Mapper(componentModel = "spring")
public interface SanctionMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(target = "userFullName",
            expression = "java(sanction.getUser().getFirstName() + \" \" + sanction.getUser().getLastName())")
    @Mapping(source = "user.email", target = "userEmail")
    SanctionResponse toResponse(Sanction sanction);
}
