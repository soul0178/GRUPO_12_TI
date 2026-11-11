package edu.unsa.epcc.loans.reservation.mapper;

import edu.unsa.epcc.loans.reservation.dto.ReservationResponse;
import edu.unsa.epcc.loans.reservation.entity.Reservation;
import edu.unsa.epcc.loans.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** Convierte una Reservation en su DTO. */
@Mapper(componentModel = "spring")
public interface ReservationMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user", target = "userFullName")
    @Mapping(source = "user.email", target = "userEmail")
    @Mapping(source = "item.id", target = "itemId")
    @Mapping(source = "item.code", target = "itemCode")
    @Mapping(source = "item.name", target = "itemName")
    @Mapping(source = "item.category.name", target = "categoryName")
    ReservationResponse toResponse(Reservation reservation);

    /** Nombre completo que se muestra de un usuario (nombres y apellidos). */
    default String fullName(User user) {
        return user.getFirstName() + " " + user.getLastName();
    }
}
