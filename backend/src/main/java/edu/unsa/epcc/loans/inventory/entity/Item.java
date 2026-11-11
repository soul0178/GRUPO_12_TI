package edu.unsa.epcc.loans.inventory.entity;

import edu.unsa.epcc.loans.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Unidad individual del inventario (un equipo, un libro u objeto) con su propio código (RF-03). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "items")
public class Item extends BaseEntity {

    /** Código de inventario en mayúsculas; es único. */
    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemStatus status;
}
