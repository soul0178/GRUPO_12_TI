package edu.unsa.epcc.loans.sanction.repository;

import edu.unsa.epcc.loans.sanction.entity.Sanction;
import edu.unsa.epcc.loans.sanction.entity.SanctionStatus;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SanctionRepository extends JpaRepository<Sanction, Long> {

    boolean existsByUserIdAndStatus(Long userId, SanctionStatus status);

    /** Lista sanciones con filtros opcionales (usuario y estado pueden ser null). */
    @EntityGraph(attributePaths = "user")
    @Query("""
            select s from Sanction s
            where (:userId is null or s.user.id = :userId)
              and (:status is null or s.status = :status)
            """)
    Page<Sanction> search(@Param("userId") Long userId, @Param("status") SanctionStatus status, Pageable pageable);

    /** Pasa a FINISHED las sanciones ACTIVE cuya fecha de fin ya se cumplió. Devuelve cuántas cambió. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Sanction s set s.status = :finished, s.updatedAt = :now
            where s.status = :active and s.endAt <= :now
            """)
    int finishExpired(@Param("now") Instant now, @Param("active") SanctionStatus active,
                      @Param("finished") SanctionStatus finished);
}
