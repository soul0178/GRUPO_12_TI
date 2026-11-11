package edu.unsa.epcc.loans.user.mapper;

import edu.unsa.epcc.loans.user.dto.CreateUserRequest;
import edu.unsa.epcc.loans.user.dto.UpdateProfileRequest;
import edu.unsa.epcc.loans.user.dto.UpdateUserRequest;
import edu.unsa.epcc.loans.user.dto.UserResponse;
import edu.unsa.epcc.loans.user.dto.UserSummaryResponse;
import edu.unsa.epcc.loans.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/** Convierte entre la entidad User y sus DTOs. */
@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);

    UserSummaryResponse toSummary(User user);

    /** La contraseña no se mapea: el servicio guarda su hash aparte. */
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "active", ignore = true)
    User toEntity(CreateUserRequest request);

    void update(UpdateUserRequest request, @MappingTarget User user);

    void updateProfile(UpdateProfileRequest request, @MappingTarget User user);
}
