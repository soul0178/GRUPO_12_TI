-- M4: préstamos y garantías
CREATE TABLE loans (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               BIGINT       NOT NULL REFERENCES users (id),
    item_id               BIGINT       NOT NULL REFERENCES items (id),
    delivered_by_id       BIGINT       NOT NULL REFERENCES users (id),
    returned_by_id        BIGINT       REFERENCES users (id),
    checked_out_at        TIMESTAMPTZ  NOT NULL,
    due_at                TIMESTAMPTZ  NOT NULL,
    returned_at           TIMESTAMPTZ,
    delivery_condition    VARCHAR(10)  NOT NULL,
    return_condition      VARCHAR(10),
    delivery_observations VARCHAR(500),
    return_observations   VARCHAR(500),
    created_at            TIMESTAMPTZ  NOT NULL,
    updated_at            TIMESTAMPTZ  NOT NULL,
    CONSTRAINT ck_loans_delivery_condition CHECK (delivery_condition IN ('GOOD', 'FAIR', 'DAMAGED')),
    CONSTRAINT ck_loans_return_condition CHECK (return_condition IN ('GOOD', 'FAIR', 'DAMAGED')),
    CONSTRAINT ck_loans_due_after_checkout CHECK (due_at > checked_out_at),
    -- Los tres datos de la devolución se registran juntos o no se registra ninguno
    CONSTRAINT ck_loans_return_data CHECK (
        (returned_at IS NULL AND return_condition IS NULL AND returned_by_id IS NULL)
        OR (returned_at IS NOT NULL AND return_condition IS NOT NULL AND returned_by_id IS NOT NULL))
);

-- RNF-02: un ítem no puede tener dos préstamos sin devolver al mismo tiempo
CREATE UNIQUE INDEX uq_loans_item_not_returned ON loans (item_id) WHERE returned_at IS NULL;
CREATE INDEX idx_loans_user_not_returned ON loans (user_id) WHERE returned_at IS NULL;
CREATE INDEX idx_loans_checked_out_at ON loans (checked_out_at DESC);

CREATE TABLE guarantees (
    id          BIGSERIAL PRIMARY KEY,
    loan_id     BIGINT       NOT NULL REFERENCES loans (id),
    type        VARCHAR(20)  NOT NULL,
    description VARCHAR(255) NOT NULL,
    returned    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_guarantees_loan UNIQUE (loan_id),
    CONSTRAINT ck_guarantees_type CHECK (type IN ('DNI', 'UNIVERSITY_ID', 'OTHER'))
);

-- Ahora que existe la tabla de préstamos, la sanción queda vinculada a su préstamo de origen (M3)
ALTER TABLE sanctions ADD CONSTRAINT fk_sanctions_loan FOREIGN KEY (loan_id) REFERENCES loans (id);
