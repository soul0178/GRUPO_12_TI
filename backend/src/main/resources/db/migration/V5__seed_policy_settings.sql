-- Valores iniciales de la política (RF-04, RF-05): máximo 3 préstamos/reservas y 30 minutos para recoger
INSERT INTO policy_settings (id, max_active_items, reservation_expiration_minutes, created_at, updated_at)
VALUES (1, 3, 30, now(), now());
