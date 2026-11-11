-- M3: sanciones de los usuarios y parámetros de política (fila única)
CREATE TABLE sanctions (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id),
    type       VARCHAR(20)  NOT NULL,
    status     VARCHAR(20)  NOT NULL,
    start_at   TIMESTAMPTZ,
    end_at     TIMESTAMPTZ,
    reason     VARCHAR(500) NOT NULL,
    -- Préstamo que originó la sanción. Sin clave foránea: la tabla de préstamos la crea M4, que añade el vínculo.
    loan_id    BIGINT       NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL,
    CONSTRAINT ck_sanctions_type CHECK (type IN ('OVERDUE', 'DAMAGE')),
    CONSTRAINT ck_sanctions_status CHECK (status IN ('SUGGESTED', 'ACTIVE', 'FINISHED', 'REJECTED')),
    CONSTRAINT ck_sanctions_dates CHECK (
        status NOT IN ('ACTIVE', 'FINISHED') OR (start_at IS NOT NULL AND end_at IS NOT NULL))
);

CREATE INDEX idx_sanctions_user_status ON sanctions (user_id, status);
CREATE INDEX idx_sanctions_status ON sanctions (status);

CREATE TABLE policy_settings (
    id                              BIGINT      PRIMARY KEY,
    max_active_items                INTEGER     NOT NULL,
    reservation_expiration_minutes  INTEGER     NOT NULL,
    created_at                      TIMESTAMPTZ NOT NULL,
    updated_at                      TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_policy_settings_single_row CHECK (id = 1),
    CONSTRAINT ck_policy_settings_max_items CHECK (max_active_items > 0),
    CONSTRAINT ck_policy_settings_expiration CHECK (reservation_expiration_minutes > 0)
);
