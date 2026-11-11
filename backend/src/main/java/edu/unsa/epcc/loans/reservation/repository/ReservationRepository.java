package edu.unsa.epcc.loans.reservation.repository;

import edu.unsa.epcc.loans.loan.entity.Loan;
import edu.unsa.epcc.loans.reservation.entity.Reservation;
import edu.unsa.epcc.loans.reservation.entity.ReservationStatus;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    long countByUserIdAndStatus(Long userId, ReservationStatus status);

    boolean existsByItemIdAndStatus(Long itemId, ReservationStatus status);

    /** Lista reservas con filtros opcionales (usuario, ítem y estado pueden ser null). */
    @EntityGraph(attributePaths = {"user", "item", "item.category"})
    @Query("""
            select r from Reservation r
            where (:userId is null or r.user.id = :userId)
              and (:itemId is null or r.item.id = :itemId)
              and (:status is null or r.status = :status)
            """)
    Page<Reservation> search(@Param("userId") Long userId, @Param("itemId") Long itemId,
                             @Param("status") ReservationStatus status, Pageable pageable);

    /** Reservas PENDING del ítem cuyo rango se solapa con [from, to). */
    @EntityGraph(attributePaths = {"user", "item", "item.category"})
    @Query("""
            select r from Reservation r
            where r.item.id = :itemId and r.status = :pending and r.startAt < :to and r.endAt > :from
            order by r.startAt
            """)
    List<Reservation> findOverlapping(@Param("itemId") Long itemId, @Param("from") Instant from,
                                      @Param("to") Instant to, @Param("pending") ReservationStatus pending);

    /** Pasa a EXPIRED las reservas PENDING cuyo inicio es anterior a {@code limit}. Devuelve cuántas cambió. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Reservation r set r.status = :expired, r.updatedAt = :now
            where r.status = :pending and r.startAt < :limit
            """)
    int expirePending(@Param("limit") Instant limit, @Param("now") Instant now,
                      @Param("pending") ReservationStatus pending, @Param("expired") ReservationStatus expired);

    /** Préstamos sin devolver de un usuario; cuentan para el límite junto con las reservas pendientes. */
    @Query("select count(l) from Loan l where l.user.id = :userId and l.returnedAt is null")
    long countOpenLoans(@Param("userId") Long userId);

    /** Préstamo sin devolver del ítem (a lo sumo uno), que ocupa el ítem hasta su vencimiento. */
    @Query("select l from Loan l where l.item.id = :itemId and l.returnedAt is null")
    List<Loan> findOpenLoans(@Param("itemId") Long itemId);
}
