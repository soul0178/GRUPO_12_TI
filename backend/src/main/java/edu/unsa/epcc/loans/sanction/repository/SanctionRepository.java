package edu.unsa.epcc.loans.sanction.repository;

import edu.unsa.epcc.loans.sanction.entity.DamageLevel;
import edu.unsa.epcc.loans.sanction.entity.Sanction;
import edu.unsa.epcc.loans.sanction.entity.SanctionStatus;
import edu.unsa.epcc.loans.sanction.entity.SanctionType;
import java.time.Instant;
import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SanctionRepository extends JpaRepository<Sanction, Long> {

    boolean existsByUserIdAndStatus(Long userId, SanctionStatus status);

    /**
     * Lista sanciones con filtros opcionales (usuario y estado pueden ser null). {@code pattern} es un LIKE en
     * minúsculas sobre nombre completo, correo o código/DNI del usuario, o sobre el motivo (que nombra al ítem); "%" no filtra.
     */
    @EntityGraph(attributePaths = "user")
    @Query("""
            select s from Sanction s
            where (:userId is null or s.user.id = :userId)
              and (:status is null or s.status = :status)
              and (:type is null or s.type = :type)
              and (lower(concat(s.user.firstName, ' ', s.user.lastName)) like :pattern
                   or lower(s.user.email) like :pattern
                   or lower(s.user.documentNumber) like :pattern
                   or lower(s.reason) like :pattern)
            """)
    Page<Sanction> search(@Param("userId") Long userId, @Param("status") SanctionStatus status,
                          @Param("type") SanctionType type, @Param("pattern") String pattern, Pageable pageable);

    /** Sanciones del usuario con alguno de los estados indicados iniciadas desde {@code since} (reincidencia). */
    @Query("""
            select count(s) from Sanction s
            where s.user.id = :userId and s.status in :statuses and s.startAt >= :since
            """)
    long countStartedSince(@Param("userId") Long userId, @Param("statuses") Collection<SanctionStatus> statuses,
                           @Param("since") Instant since);

    /** Faltas graves del usuario (pérdida o daño extremo) con alguno de los estados indicados. */
    @Query("""
            select count(s) from Sanction s
            where s.user.id = :userId and s.status in :statuses
              and (s.type = :loss or (s.type = :damage and s.damageLevel = :severe))
            """)
    long countGraveFaults(@Param("userId") Long userId, @Param("statuses") Collection<SanctionStatus> statuses,
                          @Param("loss") SanctionType loss, @Param("damage") SanctionType damage,
                          @Param("severe") DamageLevel severe);

    /** Pasa a FINISHED las sanciones ACTIVE cuya fecha de fin ya se cumplió. Devuelve cuántas cambió. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Sanction s set s.status = :finished, s.updatedAt = :now
            where s.status = :active and s.endAt <= :now
            """)
    int finishExpired(@Param("now") Instant now, @Param("active") SanctionStatus active,
                      @Param("finished") SanctionStatus finished);
}
