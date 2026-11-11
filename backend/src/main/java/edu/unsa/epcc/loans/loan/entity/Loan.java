package edu.unsa.epcc.loans.loan.entity;

import edu.unsa.epcc.loans.common.entity.BaseEntity;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Préstamo de un ítem a un usuario, desde la entrega hasta la devolución (RF-04, RF-06). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "loans")
public class Loan extends BaseEntity {

    /** Usuario que recibe el ítem. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    /** Encargado o administrador que registró la entrega. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "delivered_by_id", nullable = false)
    private User deliveredBy;

    /** Quien registró la devolución; vacío mientras el préstamo siga abierto. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "returned_by_id")
    private User returnedBy;

    /** Fecha y hora exactas de salida del ítem. */
    @Column(name = "checked_out_at", nullable = false)
    private Instant checkedOutAt;

    /** Fecha límite de devolución: salida + plazo máximo de la categoría. */
    @Column(name = "due_at", nullable = false)
    private Instant dueAt;

    /** Fecha y hora de devolución; vacía mientras el préstamo siga abierto. */
    @Column(name = "returned_at")
    private Instant returnedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_condition", nullable = false)
    private PhysicalCondition deliveryCondition;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_condition")
    private PhysicalCondition returnCondition;

    @Column(name = "delivery_observations")
    private String deliveryObservations;

    @Column(name = "return_observations")
    private String returnObservations;

    /** Garantía dejada por el usuario; solo existe si la categoría la exige. */
    @OneToOne(mappedBy = "loan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Guarantee guarantee;

    /** Estado del préstamo en el instante dado: devuelto, vencido (pasó el plazo sin devolver) o activo. */
    public LoanStatus statusAt(Instant now) {
        if (returnedAt != null) {
            return LoanStatus.RETURNED;
        }
        return now.isAfter(dueAt) ? LoanStatus.OVERDUE : LoanStatus.ACTIVE;
    }
}
