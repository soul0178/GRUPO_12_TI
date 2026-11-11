-- M2: categorías de ítems (con su política de préstamo) e ítems del inventario
CREATE TABLE categories (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(50) NOT NULL,
    max_loan_hours     INTEGER     NOT NULL,
    requires_guarantee BOOLEAN     NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL,
    updated_at         TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_categories_name UNIQUE (name),
    CONSTRAINT ck_categories_max_loan_hours CHECK (max_loan_hours > 0)
);

CREATE TABLE items (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    category_id BIGINT       NOT NULL REFERENCES categories (id),
    status      VARCHAR(20)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_items_code UNIQUE (code),
    CONSTRAINT ck_items_status CHECK (status IN ('AVAILABLE', 'ON_LOAN', 'OUT_OF_SERVICE', 'RETIRED'))
);

CREATE INDEX idx_items_category_id ON items (category_id);
CREATE INDEX idx_items_status ON items (status);
