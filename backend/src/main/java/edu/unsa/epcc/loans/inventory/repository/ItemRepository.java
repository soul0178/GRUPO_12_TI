package edu.unsa.epcc.loans.inventory.repository;

import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ItemRepository extends JpaRepository<Item, Long> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    /**
     * Busca ítems con filtros opcionales (categoría y estado pueden ser null). El texto es un patrón LIKE ya en
     * minúsculas (por ejemplo "%laptop%") que se compara con el código y el nombre.
     */
    @EntityGraph(attributePaths = "category")
    @Query("""
            select i from Item i
            where (:categoryId is null or i.category.id = :categoryId)
              and (:status is null or i.status = :status)
              and (lower(i.code) like :pattern or lower(i.name) like :pattern)
            """)
    Page<Item> search(@Param("categoryId") Long categoryId, @Param("status") ItemStatus status,
                      @Param("pattern") String pattern, Pageable pageable);
}
