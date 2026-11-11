-- M5: reservas. btree_gist permite combinar igualdad (item_id) con solape de rangos en una restricción de exclusión.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE reservations (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    item_id    BIGINT      NOT NULL REFERENCES items (id),
    start_at   TIMESTAMPTZ NOT NULL,
    end_at     TIMESTAMPTZ NOT NULL,
    status     VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_reservations_status CHECK (status IN ('PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT ck_reservations_range CHECK (end_at > start_at),
    -- RNF-02: un mismo ítem no puede tener dos reservas PENDING con rangos solapados.
    CONSTRAINT ex_reservations_no_overlap EXCLUDE USING gist (
        item_id WITH =,
        tstzrange(start_at, end_at) WITH &&
    ) WHERE (status = 'PENDING')
);

CREATE INDEX idx_reservations_user ON reservations (user_id, status);
CREATE INDEX idx_reservations_item ON reservations (item_id, status);
