-- M1: usuarios del sistema (prestatarios, encargados y administradores)
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    document_number VARCHAR(20)  NOT NULL,
    phone           VARCHAR(20),
    password_hash   VARCHAR(100) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_document_number UNIQUE (document_number),
    CONSTRAINT ck_users_role CHECK (role IN ('STUDENT', 'TEACHER', 'ADMINISTRATIVE', 'MANAGER', 'ADMIN'))
);
