-- Sanciones: no recoger reserva (NO_SHOW), pérdida (LOSS), niveles de daño, baneo por faltas graves y levantamiento.

-- Una sanción nace de un préstamo (atraso, daño, pérdida) o de una reserva (no recogida): exactamente uno de los dos.
ALTER TABLE sanctions ALTER COLUMN loan_id DROP NOT NULL;
ALTER TABLE sanctions ADD COLUMN reservation_id BIGINT REFERENCES reservations (id);
ALTER TABLE sanctions ADD COLUMN damage_level VARCHAR(10);
ALTER TABLE sanctions ADD COLUMN caused_ban BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sanctions ADD COLUMN admin_note VARCHAR(500);

UPDATE sanctions SET damage_level = 'MODERATE' WHERE type = 'DAMAGE';

ALTER TABLE sanctions DROP CONSTRAINT ck_sanctions_type;
ALTER TABLE sanctions ADD CONSTRAINT ck_sanctions_type
    CHECK (type IN ('OVERDUE', 'DAMAGE', 'NO_SHOW', 'LOSS'));
ALTER TABLE sanctions DROP CONSTRAINT ck_sanctions_status;
ALTER TABLE sanctions ADD CONSTRAINT ck_sanctions_status
    CHECK (status IN ('SUGGESTED', 'ACTIVE', 'FINISHED', 'REJECTED', 'LIFTED'));
ALTER TABLE sanctions DROP CONSTRAINT ck_sanctions_dates;
ALTER TABLE sanctions ADD CONSTRAINT ck_sanctions_dates CHECK (
    status NOT IN ('ACTIVE', 'FINISHED', 'LIFTED') OR (start_at IS NOT NULL AND end_at IS NOT NULL));
ALTER TABLE sanctions ADD CONSTRAINT ck_sanctions_damage_level
    CHECK (damage_level IS NULL OR damage_level IN ('MINOR', 'MODERATE', 'SEVERE'));
ALTER TABLE sanctions ADD CONSTRAINT ck_sanctions_origin
    CHECK ((loan_id IS NOT NULL AND reservation_id IS NULL) OR (loan_id IS NULL AND reservation_id IS NOT NULL));

CREATE INDEX idx_sanctions_reservation ON sanctions (reservation_id);

-- Préstamos: un ítem puede devolverse como perdido y, si vuelve dañado, se registra el nivel del daño
ALTER TABLE loans ADD COLUMN return_damage_level VARCHAR(10);
ALTER TABLE loans DROP CONSTRAINT ck_loans_return_condition;
ALTER TABLE loans ADD CONSTRAINT ck_loans_return_condition
    CHECK (return_condition IN ('GOOD', 'FAIR', 'DAMAGED', 'LOST'));
ALTER TABLE loans ADD CONSTRAINT ck_loans_return_damage_level
    CHECK (return_damage_level IS NULL OR return_damage_level IN ('MINOR', 'MODERATE', 'SEVERE'));
