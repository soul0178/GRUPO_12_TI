package edu.unsa.epcc.loans.loan.repository;

import edu.unsa.epcc.loans.loan.entity.Loan;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    /** Cantidad de préstamos sin devolver de un usuario (activos y vencidos). */
    long countByUserIdAndReturnedAtIsNull(Long userId);

    /**
     * Busca préstamos con filtros opcionales. {@code returned} indica si ya se devolvieron y {@code overdue} si el
     * vencimiento ya pasó respecto de {@code now}; cualquiera de los filtros puede ser null.
     */
    @EntityGraph(attributePaths = {"user", "item", "item.category", "deliveredBy", "returnedBy", "guarantee"})
    @Query("""
            select l from Loan l
            where (:userId is null or l.user.id = :userId)
              and (:itemId is null or l.item.id = :itemId)
              and (:returned is null or (:returned = true and l.returnedAt is not null)
                   or (:returned = false and l.returnedAt is null))
              and (:overdue is null or (:overdue = true and l.dueAt < :now)
                   or (:overdue = false and l.dueAt >= :now))
            """)
    Page<Loan> search(@Param("userId") Long userId, @Param("itemId") Long itemId,
                      @Param("returned") Boolean returned, @Param("overdue") Boolean overdue,
                      @Param("now") Instant now, Pageable pageable);
}
