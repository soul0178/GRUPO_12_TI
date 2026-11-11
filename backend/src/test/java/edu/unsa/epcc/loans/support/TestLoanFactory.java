package edu.unsa.epcc.loans.support;

import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.loan.entity.Loan;
import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import edu.unsa.epcc.loans.loan.repository.LoanRepository;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Crea préstamos abiertos de prueba directamente en la base, sin pasar por las reglas de entrega. */
@Component
@RequiredArgsConstructor
public class TestLoanFactory {

    private final LoanRepository loanRepository;
    private final TestItemFactory items;
    private final TestUserFactory users;

    /** Crea un préstamo abierto de un ítem nuevo (de la categoría "Libro") para el usuario indicado. */
    public Loan create(User user) {
        Item item = items.create("Libro", ItemStatus.ON_LOAN);
        Instant now = Instant.now();
        Loan loan = new Loan();
        loan.setUser(user);
        loan.setItem(item);
        loan.setDeliveredBy(users.create(Role.MANAGER));
        loan.setCheckedOutAt(now);
        loan.setDueAt(now.plusSeconds(3600));
        loan.setDeliveryCondition(PhysicalCondition.GOOD);
        return loanRepository.saveAndFlush(loan);
    }
}
