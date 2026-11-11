package edu.unsa.epcc.loans.user.repository;

import edu.unsa.epcc.loans.user.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByDocumentNumber(String documentNumber);

    boolean existsByDocumentNumberAndIdNot(String documentNumber, Long id);

    /** Busca por nombre completo, correo o código/DNI; el patrón LIKE llega en minúsculas (por ejemplo "%ana%"). */
    @Query("""
            select u from User u
            where lower(concat(u.firstName, ' ', u.lastName)) like :pattern
               or lower(u.email) like :pattern
               or lower(u.documentNumber) like :pattern
            """)
    List<User> search(@Param("pattern") String pattern, Pageable pageable);
}
