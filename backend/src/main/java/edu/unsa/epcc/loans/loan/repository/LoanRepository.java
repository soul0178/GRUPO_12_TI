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

    /**
     * Historial de préstamos de un usuario o de un ítem (uno de los dos filtros, o ambos) con salida en
     * [from, to). {@code returned} y {@code overdue} funcionan igual que en {@link #search}.
     */
    @EntityGraph(attributePaths = {"user", "item", "item.category", "deliveredBy", "returnedBy", "guarantee"})
    @Query("""
            select l from Loan l
            where (:userId is null or l.user.id = :userId)
              and (:itemId is null or l.item.id = :itemId)
              and l.checkedOutAt >= :fromAt and l.checkedOutAt < :toAt
              and (:returned is null or (:returned = true and l.returnedAt is not null)
                   or (:returned = false and l.returnedAt is null))
              and (:overdue is null or (:overdue = true and l.dueAt < :now)
                   or (:overdue = false and l.dueAt >= :now))
            """)
    Page<Loan> history(@Param("userId") Long userId, @Param("itemId") Long itemId,
                       @Param("fromAt") Instant fromAt, @Param("toAt") Instant toAt,
                       @Param("returned") Boolean returned, @Param("overdue") Boolean overdue,
                       @Param("now") Instant now, Pageable pageable);

    /** Conteos por estado del mismo historial (sin filtrar por estado) con salida en [from, to). */
    @Query("""
            select count(l) as totalLoans,
                   count(case when l.returnedAt is null and l.dueAt >= :now then 1 end) as activeLoans,
                   count(case when l.returnedAt is null and l.dueAt < :now then 1 end) as overdueLoans,
                   count(case when l.returnedAt is not null then 1 end) as returnedLoans,
                   count(case when l.returnedAt is not null and l.returnedAt > l.dueAt then 1 end) as lateReturns,
                   count(case when l.returnCondition = edu.unsa.epcc.loans.loan.entity.PhysicalCondition.DAMAGED
                         then 1 end) as damagedReturns,
                   count(case when l.returnedAt is not null
                         and l.returnCondition <> edu.unsa.epcc.loans.loan.entity.PhysicalCondition.DAMAGED
                         and l.returnCondition <> edu.unsa.epcc.loans.loan.entity.PhysicalCondition.LOST
                         then 1 end) as normalReturns,
                   count(case when l.returnCondition = edu.unsa.epcc.loans.loan.entity.PhysicalCondition.LOST
                         then 1 end) as lostReturns
            from Loan l
            where (:userId is null or l.user.id = :userId)
              and (:itemId is null or l.item.id = :itemId)
              and l.checkedOutAt >= :fromAt and l.checkedOutAt < :toAt
            """)
    LoanHistoryCounts historyCounts(@Param("userId") Long userId, @Param("itemId") Long itemId,
                                    @Param("fromAt") Instant fromAt, @Param("toAt") Instant toAt,
                                    @Param("now") Instant now);
}
