-- Categorías iniciales (RF-03): plazo máximo en horas y si exigen garantía
INSERT INTO categories (name, max_loan_hours, requires_guarantee, created_at, updated_at) VALUES
    ('Equipo', 4, TRUE, now(), now()),
    ('Libro', 72, FALSE, now(), now()),
    ('Objeto', 24, FALSE, now(), now());
