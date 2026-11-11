package edu.unsa.epcc.loans.loan.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.unsa.epcc.loans.loan.entity.Loan;
import edu.unsa.epcc.loans.loan.repository.LoanRepository;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestLoanFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

/** RNF-02: la base de datos impide dos préstamos sin devolver del mismo ítem. */
class LoanConstraintTest extends IntegrationTestBase {

    @Autowired
    private LoanRepository loanRepository;
    @Autowired
    private TestLoanFactory loans;
    @Autowired
    private TestUserFactory users;

    @Test
    void shouldRejectTwoOpenLoansOfSameItemInDatabase() {
        Loan first = loans.create(users.create(Role.STUDENT));
        Loan duplicate = new Loan();
        duplicate.setUser(users.create(Role.STUDENT));
        duplicate.setItem(first.getItem());
        duplicate.setDeliveredBy(first.getDeliveredBy());
        duplicate.setCheckedOutAt(Instant.now());
        duplicate.setDueAt(Instant.now().plusSeconds(3600));
        duplicate.setDeliveryCondition(first.getDeliveryCondition());

        assertThatThrownBy(() -> loanRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
