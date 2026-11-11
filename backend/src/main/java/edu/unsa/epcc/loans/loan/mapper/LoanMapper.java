package edu.unsa.epcc.loans.loan.mapper;

import edu.unsa.epcc.loans.loan.dto.GuaranteeResponse;
import edu.unsa.epcc.loans.loan.dto.LoanResponse;
import edu.unsa.epcc.loans.loan.entity.Guarantee;
import edu.unsa.epcc.loans.loan.entity.Loan;
import edu.unsa.epcc.loans.user.entity.User;
import java.time.Instant;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** Convierte un Loan en su DTO; el estado se calcula con la hora indicada porque no se guarda. */
@Mapper(componentModel = "spring")
public interface LoanMapper {

    @Mapping(source = "loan.user.id", target = "userId")
    @Mapping(source = "loan.user", target = "userFullName")
    @Mapping(source = "loan.user.email", target = "userEmail")
    @Mapping(source = "loan.item.id", target = "itemId")
    @Mapping(source = "loan.item.code", target = "itemCode")
    @Mapping(source = "loan.item.name", target = "itemName")
    @Mapping(source = "loan.item.category.name", target = "categoryName")
    @Mapping(source = "loan.deliveredBy", target = "deliveredByName")
    @Mapping(source = "loan.returnedBy", target = "returnedByName")
    @Mapping(target = "status", expression = "java(loan.statusAt(now))")
    LoanResponse toResponse(Loan loan, @Context Instant now);

    GuaranteeResponse toGuaranteeResponse(Guarantee guarantee);

    /** Nombre completo que se muestra de un usuario (nombres y apellidos); null si aún no hay usuario. */
    default String fullName(User user) {
        if (user == null) {
            return null;
        }
        return user.getFirstName() + " " + user.getLastName();
    }
}
