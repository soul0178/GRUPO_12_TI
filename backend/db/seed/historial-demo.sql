-- Historial de demostración: BORRA todos los préstamos, garantías, reservas y sanciones y genera
-- ~4 meses de movimiento pasado (17-ago-2026 al 25-nov-2026) con los usuarios e ítems que ya existen.
--
--   docker exec -i loans-db psql -U loans -d loans -v ON_ERROR_STOP=1 < backend/db/seed/historial-demo.sql
--
-- NO borra usuarios, ítems, categorías ni la política (esos datos vienen de demo-data.sql).
-- Los datos salen de una semilla fija: cada ejecución produce el mismo historial.
-- Respeta las reglas del sistema: horario 07:00-20:10 (Lima), sin movimientos en domingo, plazos por categoría
-- (equipo 4 h, objeto 24 h, libro 72 h), garantía en los equipos, sanciones según docs/politica-sanciones.md
-- y un ítem nunca tiene dos préstamos a la vez.
-- Al final deja 5 préstamos vigentes el 2-dic-2026 y algunas reservas pendientes próximas.
BEGIN;

TRUNCATE guarantees, sanctions, reservations, loans RESTART IDENTITY;
UPDATE items SET status = 'AVAILABLE', updated_at = now();

-- ---------- Funciones auxiliares (hora local de Lima, sin zona) ----------

-- Lleva una hora al horario de atención (07:00-20:10) y fuera del domingo, siempre hacia atrás.
CREATE FUNCTION pg_temp.biz(ts timestamp) RETURNS timestamp AS $$
DECLARE t timestamp := ts;
BEGIN
    LOOP
        IF extract(dow FROM t) = 0 THEN
            t := date_trunc('day', t) - interval '1 day' + time '19:30';
        ELSIF t::time > time '20:00' THEN
            t := date_trunc('day', t) + time '19:30';
        ELSIF t::time < time '07:00' THEN
            t := date_trunc('day', t) - interval '1 day' + time '19:30';
        ELSE
            RETURN t;
        END IF;
    END LOOP;
END $$ LANGUAGE plpgsql;

-- Vencimiento: salida + plazo, ajustado al horario de atención (nunca después de las 20:10 ni en domingo).
CREATE FUNCTION pg_temp.due_for(start_at timestamp, hours int) RETURNS timestamp AS $$
DECLARE d timestamp := start_at + hours * interval '1 hour';
BEGIN
    LOOP
        IF extract(dow FROM d) = 0 THEN
            d := date_trunc('day', d) - interval '1 day' + time '20:10';
        ELSIF d::time > time '20:10' THEN
            d := date_trunc('day', d) + time '20:10';
        ELSIF d::time < time '07:00' THEN
            d := date_trunc('day', d) - interval '1 day' + time '20:10';
        ELSE
            RETURN d;
        END IF;
    END LOOP;
END $$ LANGUAGE plpgsql;

CREATE FUNCTION pg_temp.has_sunday(a timestamp, b timestamp) RETURNS boolean AS $$
    SELECT EXISTS (SELECT 1 FROM generate_series(a::date, b::date, interval '1 day') g WHERE extract(dow FROM g) = 0)
$$ LANGUAGE sql;

DO $$
DECLARE
    tz            CONSTANT text := 'America/Lima';
    now_ts        timestamptz := now();
    first_day     CONSTANT date := DATE '2026-08-17';
    last_day      CONSTANT date := DATE '2026-11-25';
    staff         bigint[];
    borrowers     bigint[];
    n_staff       int;
    n_users       int;
    n_items       int;
    -- ítems
    item_ids      bigint[];
    item_codes    text[];
    item_hours    int[];
    item_guar     boolean[];
    item_free     timestamp[];
    item_retired  boolean[];
    item_damaged  boolean[];
    -- usuarios
    u_blocked     timestamp[];
    u_sanctions   int[];
    u_graves      int[];
    u_docs        text[];
    lost_count    int := 0;
    d             date;
    i             int;
    tries         int;
    ui            int;
    uid           bigint;
    roll          double precision;
    p_loan        double precision;
    start_l       timestamp;
    out_l         timestamp;
    due_l         timestamp;
    ret_l         timestamp;
    outcome       text;
    delivery_c    text;
    return_c      text;
    dmg_level     text;
    obs           text;
    reserved      boolean;
    loan_id       bigint;
    res_id        bigint;
    s_type        text;
    s_days        int;
    s_mult        int;
    s_status      text;
    s_start       timestamp;
    s_end         timestamp;
    s_note        text;
    s_dmg         text;
    late_days     int;
    g_type        text;
    g_desc        text;
    del_by        bigint;
    ret_by        bigint;
BEGIN
    PERFORM setseed(0.2026);

    SELECT array_agg(id ORDER BY id) INTO staff FROM users WHERE role IN ('ADMIN', 'MANAGER') AND active;
    SELECT array_agg(id ORDER BY id), array_agg(document_number ORDER BY id)
      INTO borrowers, u_docs FROM users WHERE role IN ('STUDENT', 'TEACHER', 'ADMINISTRATIVE') AND active;
    IF staff IS NULL OR borrowers IS NULL THEN
        RAISE EXCEPTION 'Faltan usuarios: ejecute primero demo-data.sql y cree un administrador.';
    END IF;
    n_staff := array_length(staff, 1);
    n_users := array_length(borrowers, 1);

    SELECT array_agg(i.id ORDER BY i.id), array_agg(i.code ORDER BY i.id), array_agg(c.max_loan_hours ORDER BY i.id),
           array_agg(c.requires_guarantee ORDER BY i.id)
      INTO item_ids, item_codes, item_hours, item_guar
      FROM items i JOIN categories c ON c.id = i.category_id;
    IF item_ids IS NULL THEN
        RAISE EXCEPTION 'No hay ítems: ejecute primero demo-data.sql.';
    END IF;
    n_items := array_length(item_ids, 1);

    item_free := array_fill(first_day::timestamp, ARRAY[n_items]);
    item_retired := array_fill(false, ARRAY[n_items]);
    item_damaged := array_fill(false, ARRAY[n_items]);
    u_blocked := array_fill(first_day::timestamp, ARRAY[n_users]);
    u_sanctions := array_fill(0, ARRAY[n_users]);
    u_graves := array_fill(0, ARRAY[n_users]);

    FOR d IN SELECT g::date FROM generate_series(first_day, last_day, interval '1 day') g LOOP
        CONTINUE WHEN extract(dow FROM d) = 0;  -- domingo cerrado

        FOR i IN 1..n_items LOOP
            CONTINUE WHEN item_retired[i];
            p_loan := CASE WHEN item_hours[i] <= 4 THEN 0.55 WHEN item_hours[i] <= 24 THEN 0.35 ELSE 0.20 END;
            -- más movimiento entre semana en horas de clase (lunes a viernes) que el sábado
            IF extract(dow FROM d) = 6 THEN p_loan := p_loan * 0.4; END IF;
            roll := random();
            CONTINUE WHEN roll >= p_loan + 0.045;

            -- hora de salida entre 07:20 y 18:00
            out_l := d + time '07:20' + floor(random() * 640)::int * interval '1 minute';
            CONTINUE WHEN item_free[i] > out_l;

            -- usuario: algunos piden mucho más que otros; no puede tener una sanción activa
            uid := NULL;
            FOR tries IN 1..8 LOOP
                ui := 1 + floor(power(random(), 1.5) * n_users)::int;
                IF u_blocked[ui] <= out_l THEN uid := borrowers[ui]; EXIT; END IF;
            END LOOP;
            CONTINUE WHEN uid IS NULL;

            due_l := pg_temp.due_for(out_l, item_hours[i]);
            del_by := staff[1 + floor(random() * n_staff)::int];

            -- ---------- Reserva que no se concreta ----------
            IF roll >= p_loan THEN
                CONTINUE WHEN pg_temp.has_sunday(out_l, due_l);
                IF random() < 0.6 THEN
                    -- cancelada antes de la hora de recojo
                    INSERT INTO reservations (user_id, item_id, start_at, end_at, status, created_at, updated_at)
                    VALUES (uid, item_ids[i], out_l AT TIME ZONE tz, due_l AT TIME ZONE tz, 'CANCELLED',
                            (out_l - interval '2 days' + random() * interval '30 hours') AT TIME ZONE tz,
                            (out_l - interval '1 hour' - random() * interval '20 hours') AT TIME ZONE tz);
                ELSE
                    -- vencida: no recogió el ítem -> sanción mínima por no recoger
                    INSERT INTO reservations (user_id, item_id, start_at, end_at, status, created_at, updated_at)
                    VALUES (uid, item_ids[i], out_l AT TIME ZONE tz, due_l AT TIME ZONE tz, 'EXPIRED',
                            (out_l - interval '1 day' - random() * interval '20 hours') AT TIME ZONE tz,
                            (out_l + interval '30 minutes') AT TIME ZONE tz)
                    RETURNING id INTO res_id;
                    s_mult := CASE WHEN u_sanctions[ui] = 0 THEN 1 WHEN u_sanctions[ui] = 1 THEN 2 ELSE 3 END;
                    s_start := out_l + interval '30 minutes';
                    s_end := s_start + s_mult * interval '1 day';
                    INSERT INTO sanctions (user_id, type, status, start_at, end_at, reason, reservation_id, caused_ban,
                                           created_at, updated_at)
                    VALUES (uid, 'NO_SHOW', CASE WHEN s_end AT TIME ZONE tz > now_ts THEN 'ACTIVE' ELSE 'FINISHED' END,
                            s_start AT TIME ZONE tz, s_end AT TIME ZONE tz,
                            'No recogió la reserva ' || res_id || ' del ítem ' || item_codes[i], res_id, false,
                            s_start AT TIME ZONE tz, s_end AT TIME ZONE tz);
                    u_sanctions[ui] := u_sanctions[ui] + 1;
                    u_blocked[ui] := s_end;
                END IF;
                CONTINUE;
            END IF;

            -- ---------- Préstamo ----------
            reserved := NOT pg_temp.has_sunday(out_l, due_l) AND random() < 0.35;
            delivery_c := CASE WHEN random() < 0.15 THEN 'FAIR' ELSE 'GOOD' END;
            dmg_level := NULL;
            obs := NULL;
            roll := random();
            outcome := CASE WHEN roll < 0.72 THEN 'ONTIME'
                            WHEN roll < 0.89 THEN 'LATE'
                            ELSE 'DAMAGED' END;
            -- dos pérdidas en todo el historial: una desde octubre y otra desde noviembre
            IF lost_count < 2 AND d >= DATE '2026-10-05' + lost_count * 30 AND random() < 0.25 THEN
                outcome := 'LOST';
            END IF;
            -- la pérdida solo aplica a libros/objetos que no van a los préstamos del 2-dic
            IF outcome = 'LOST' AND (item_codes[i] NOT IN ('LB-004', 'LB-006', 'OB-002', 'OB-003', 'OB-005', 'OB-006')
                                     OR u_graves[ui] >= 2) THEN
                outcome := 'ONTIME';
            END IF;
            IF outcome = 'DAMAGED' AND u_graves[ui] >= 2 THEN outcome := 'ONTIME'; END IF;
            -- los daños no deben caer en los ítems de los préstamos del 2-dic (siguen disponibles)
            IF outcome = 'DAMAGED' AND item_codes[i] IN ('LB-001', 'LB-003', 'LB-005', 'OB-001', 'OB-004') THEN
                outcome := 'ONTIME';
            END IF;

            IF outcome = 'ONTIME' THEN
                ret_l := greatest(pg_temp.biz(out_l + (0.25 + 0.7 * random()) * (due_l - out_l)),
                                  out_l + interval '15 minutes');
                return_c := CASE WHEN delivery_c = 'FAIR' THEN 'FAIR' ELSE 'GOOD' END;
            ELSIF outcome = 'LATE' THEN
                ret_l := pg_temp.biz(due_l + interval '12 hours' + random() * interval '90 hours');
                IF ret_l <= due_l THEN ret_l := pg_temp.biz(due_l + interval '2 days' + interval '10 hours'); END IF;
                IF ret_l <= due_l THEN ret_l := due_l + interval '1 day' + interval '12 hours'; END IF;
                return_c := CASE WHEN delivery_c = 'FAIR' THEN 'FAIR' ELSE 'GOOD' END;
                obs := 'Devuelto con atraso';
            ELSIF outcome = 'DAMAGED' THEN
                ret_l := greatest(pg_temp.biz(out_l + (0.3 + 0.65 * random()) * (due_l - out_l)),
                                  out_l + interval '15 minutes');
                return_c := 'DAMAGED';
                roll := random();
                dmg_level := CASE WHEN roll < 0.55 THEN 'MINOR' WHEN roll < 0.90 THEN 'MODERATE' ELSE 'SEVERE' END;
                obs := CASE dmg_level WHEN 'MINOR' THEN 'Marcas leves de uso'
                                      WHEN 'MODERATE' THEN 'Daño que afecta el uso del ítem'
                                      ELSE 'El ítem quedó inservible' END;
            ELSE  -- LOST
                ret_l := pg_temp.biz(due_l + interval '1 day' + random() * interval '8 hours');
                IF ret_l <= due_l THEN ret_l := due_l + interval '1 day' + interval '12 hours'; END IF;
                return_c := 'LOST';
                obs := 'El usuario no devolvió el ítem; se da de baja';
                lost_count := lost_count + 1;
            END IF;
            ret_by := staff[1 + floor(random() * n_staff)::int];

            -- la reserva (si la hubo) se recogió unos minutos antes de entregar
            IF reserved THEN
                out_l := out_l + (5 + floor(random() * 15)::int) * interval '1 minute';
                due_l := pg_temp.due_for(out_l, item_hours[i]);
                IF ret_l <= out_l THEN ret_l := out_l + interval '20 minutes'; END IF;
            END IF;

            INSERT INTO loans (user_id, item_id, delivered_by_id, returned_by_id, checked_out_at, due_at, returned_at,
                               delivery_condition, return_condition, return_damage_level, delivery_observations,
                               return_observations, created_at, updated_at)
            VALUES (uid, item_ids[i], del_by, ret_by, out_l AT TIME ZONE tz, due_l AT TIME ZONE tz,
                    ret_l AT TIME ZONE tz, delivery_c, return_c, dmg_level, NULL, obs,
                    out_l AT TIME ZONE tz, ret_l AT TIME ZONE tz)
            RETURNING id INTO loan_id;

            IF reserved THEN
                INSERT INTO reservations (user_id, item_id, start_at, end_at, status, created_at, updated_at)
                VALUES (uid, item_ids[i], (out_l - interval '10 minutes') AT TIME ZONE tz, due_l AT TIME ZONE tz,
                        'FULFILLED', (out_l - interval '1 day' - random() * interval '30 hours') AT TIME ZONE tz,
                        out_l AT TIME ZONE tz);
            END IF;

            IF item_guar[i] THEN
                roll := random();
                g_type := CASE WHEN roll < 0.5 THEN 'DNI' WHEN roll < 0.9 THEN 'UNIVERSITY_ID' ELSE 'OTHER' END;
                g_desc := CASE g_type WHEN 'DNI' THEN 'DNI ' || u_docs[ui]
                                      WHEN 'UNIVERSITY_ID' THEN 'Carné universitario ' || u_docs[ui]
                                      ELSE 'Licencia de conducir' END;
                INSERT INTO guarantees (loan_id, type, description, returned, created_at, updated_at)
                VALUES (loan_id, g_type, g_desc, outcome <> 'LOST', out_l AT TIME ZONE tz, ret_l AT TIME ZONE tz);
            END IF;

            -- el ítem vuelve a estar libre (o queda en reparación / dado de baja)
            item_free[i] := ret_l + CASE WHEN outcome = 'DAMAGED' THEN
                                CASE dmg_level WHEN 'SEVERE' THEN interval '7 days' WHEN 'MODERATE' THEN interval '3 days'
                                               ELSE interval '1 day' END
                            ELSE interval '15 minutes' END;
            IF outcome = 'DAMAGED' THEN item_damaged[i] := true; END IF;
            IF outcome = 'LOST' THEN item_retired[i] := true; END IF;

            -- ---------- Sanciones del préstamo ----------
            s_type := NULL;
            IF outcome = 'LATE' THEN
                s_type := 'OVERDUE';
                late_days := greatest(1, ceil(extract(epoch FROM (ret_l - due_l)) / 86400)::int);
                s_days := least(late_days, 30);
            ELSIF outcome = 'DAMAGED' THEN
                s_type := 'DAMAGE';
                s_days := CASE dmg_level WHEN 'MINOR' THEN 3 WHEN 'MODERATE' THEN 15 ELSE 60 END;
            ELSIF outcome = 'LOST' THEN
                s_type := 'LOSS';
                s_days := 90;
            END IF;

            IF s_type IS NOT NULL THEN
                s_mult := CASE WHEN u_sanctions[ui] = 0 THEN 1 WHEN u_sanctions[ui] = 1 THEN 2 ELSE 3 END;
                s_days := least(90, s_days * s_mult);
                s_start := ret_l;
                s_end := ret_l + s_days * interval '1 day';
                s_note := NULL;
                s_dmg := CASE WHEN s_type = 'DAMAGE' THEN dmg_level END;
                s_status := CASE WHEN s_end AT TIME ZONE tz > now_ts THEN 'ACTIVE' ELSE 'FINISHED' END;

                IF s_type = 'DAMAGE' THEN
                    IF ret_l AT TIME ZONE tz > now_ts - interval '3 days' THEN
                        s_status := 'SUGGESTED';   -- el administrador aún no la revisa
                    ELSIF random() < 0.10 THEN
                        s_status := 'REJECTED';
                        s_note := 'Al revisar el ítem no se encontró daño atribuible al usuario';
                    END IF;
                ELSIF s_type = 'OVERDUE' AND s_days >= 5 AND s_status = 'FINISHED' AND random() < 0.15 THEN
                    s_status := 'LIFTED';
                    s_end := s_start + (s_days * 0.4) * interval '1 day';
                    s_note := 'Levantada por el administrador: justificó el atraso';
                END IF;

                IF s_status IN ('SUGGESTED', 'REJECTED') THEN
                    INSERT INTO sanctions (user_id, type, status, start_at, end_at, reason, loan_id, damage_level,
                                           caused_ban, admin_note, created_at, updated_at)
                    VALUES (uid, s_type, s_status, NULL, NULL,
                            'Posible daño en el préstamo ' || loan_id || ' del ítem ' || item_codes[i],
                            loan_id, s_dmg, false, s_note, ret_l AT TIME ZONE tz, ret_l AT TIME ZONE tz);
                ELSE
                    INSERT INTO sanctions (user_id, type, status, start_at, end_at, reason, loan_id, damage_level,
                                           caused_ban, admin_note, created_at, updated_at)
                    VALUES (uid, s_type, s_status, s_start AT TIME ZONE tz, s_end AT TIME ZONE tz,
                            CASE s_type
                                WHEN 'OVERDUE' THEN 'Devolvió con ' || late_days || ' día(s) de atraso el ítem '
                                                    || item_codes[i]
                                WHEN 'DAMAGE' THEN 'Daño ' || lower(CASE dmg_level WHEN 'MINOR' THEN 'leve'
                                                    WHEN 'MODERATE' THEN 'moderado' ELSE 'extremo' END)
                                                    || ' del ítem ' || item_codes[i]
                                ELSE 'Pérdida del ítem ' || item_codes[i] END,
                            loan_id, s_dmg, false, s_note,
                            s_start AT TIME ZONE tz, s_end AT TIME ZONE tz);
                    u_sanctions[ui] := u_sanctions[ui] + 1;
                    u_blocked[ui] := greatest(u_blocked[ui], s_end);
                    IF s_type = 'LOSS' OR (s_type = 'DAMAGE' AND dmg_level = 'SEVERE') THEN
                        u_graves[ui] := u_graves[ui] + 1;
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    -- Estado final de los ítems
    FOR i IN 1..n_items LOOP
        IF item_retired[i] THEN
            UPDATE items SET status = 'RETIRED', updated_at = now_ts WHERE id = item_ids[i];
        ELSIF item_damaged[i] AND item_free[i] > (now_ts AT TIME ZONE tz) THEN
            UPDATE items SET status = 'OUT_OF_SERVICE', updated_at = now_ts WHERE id = item_ids[i];
        END IF;
    END LOOP;
END $$;

-- ---------- 5 préstamos vigentes el 2 de diciembre de 2026 ----------
UPDATE items SET status = 'AVAILABLE', updated_at = now()
WHERE code IN ('LB-001', 'LB-003', 'LB-005', 'OB-001', 'OB-004');

INSERT INTO loans (user_id, item_id, delivered_by_id, checked_out_at, due_at, delivery_condition, created_at, updated_at)
SELECT u.id, i.id,
       (SELECT id FROM users WHERE role IN ('ADMIN', 'MANAGER') ORDER BY id LIMIT 1),
       (DATE '2026-12-02' + v.salida) AT TIME ZONE 'America/Lima',
       (DATE '2026-12-02' + TIME '20:10') AT TIME ZONE 'America/Lima',
       'GOOD', now(), now()
FROM (VALUES
    ('LB-001', 'jafarob@unsa.edu.pe', TIME '07:30'),
    ('LB-003', 'acarpioch@unsa.edu.pe', TIME '08:00'),
    ('LB-005', 'wramos@unsa.edu.pe', TIME '07:45'),
    ('OB-001', 'rfloresqu@unsa.edu.pe', TIME '08:15'),
    ('OB-004', 'dcanqui@unsa.edu.pe', TIME '09:00')
) AS v(item_code, email, salida)
JOIN items i ON i.code = v.item_code
JOIN users u ON u.email = v.email;

UPDATE items SET status = 'ON_LOAN', updated_at = now()
WHERE id IN (SELECT item_id FROM loans WHERE returned_at IS NULL);

-- ---------- Reservas pendientes para los próximos días (sin domingos) ----------
INSERT INTO reservations (user_id, item_id, start_at, end_at, status, created_at, updated_at)
SELECT u.id, i.id,
       ((v.day + CASE WHEN extract(dow FROM v.day) = 0 THEN 1 ELSE 0 END) + v.h_from) AT TIME ZONE 'America/Lima',
       ((v.day + CASE WHEN extract(dow FROM v.day) = 0 THEN 1 ELSE 0 END) + v.h_to) AT TIME ZONE 'America/Lima',
       'PENDING', now(), now()
FROM (VALUES
    ('EQ-001', 'mluisj@unsa.edu.pe', (current_date + 1), TIME '09:00', TIME '13:00'),
    ('EQ-002', 'ltitov@unsa.edu.pe', (current_date + 2), TIME '10:00', TIME '14:00'),
    ('EQ-005', 'wramos@unsa.edu.pe', (current_date + 3), TIME '08:00', TIME '12:00'),
    ('EQ-003', 'dquispello@unsa.edu.pe', (current_date + 4), TIME '15:00', TIME '19:00')
) AS v(item_code, email, day, h_from, h_to)
JOIN items i ON i.code = v.item_code AND i.status = 'AVAILABLE'
JOIN users u ON u.email = v.email
ON CONFLICT DO NOTHING;

-- ---------- Comprobaciones de coherencia (abortan si algo está mal) ----------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM loans WHERE returned_at IS NOT NULL AND returned_at <= checked_out_at) THEN
        RAISE EXCEPTION 'Hay devoluciones anteriores a la salida';
    END IF;
    IF EXISTS (SELECT 1 FROM loans
               WHERE (checked_out_at AT TIME ZONE 'America/Lima')::time NOT BETWEEN TIME '07:00' AND TIME '20:10'
                  OR (due_at AT TIME ZONE 'America/Lima')::time NOT BETWEEN TIME '07:00' AND TIME '20:10'
                  OR (returned_at AT TIME ZONE 'America/Lima')::time NOT BETWEEN TIME '07:00' AND TIME '20:10') THEN
        RAISE EXCEPTION 'Hay horas fuera del horario de atención';
    END IF;
    IF EXISTS (SELECT 1 FROM loans
               WHERE extract(dow FROM checked_out_at AT TIME ZONE 'America/Lima') = 0
                  OR extract(dow FROM due_at AT TIME ZONE 'America/Lima') = 0
                  OR extract(dow FROM returned_at AT TIME ZONE 'America/Lima') = 0) THEN
        RAISE EXCEPTION 'Hay movimientos en domingo';
    END IF;
    IF EXISTS (SELECT 1 FROM loans a JOIN loans b ON a.item_id = b.item_id AND a.id < b.id
               WHERE a.checked_out_at < coalesce(b.returned_at, 'infinity') AND b.checked_out_at < coalesce(a.returned_at, 'infinity')) THEN
        RAISE EXCEPTION 'Hay préstamos solapados del mismo ítem';
    END IF;
END $$;

COMMIT;

-- ---------- Resumen ----------
SELECT count(*) AS usuarios FROM users;
SELECT status AS estado_item, count(*) FROM items GROUP BY status ORDER BY status;
SELECT count(*) AS prestamos,
       count(*) FILTER (WHERE returned_at IS NULL) AS vigentes,
       count(*) FILTER (WHERE returned_at > due_at) AS devueltos_con_atraso,
       count(*) FILTER (WHERE return_condition IN ('GOOD', 'FAIR')) AS devoluciones_normales,
       count(*) FILTER (WHERE return_condition = 'DAMAGED') AS devoluciones_danadas,
       count(*) FILTER (WHERE return_condition = 'LOST') AS devoluciones_perdidas
FROM loans;
SELECT type AS tipo_sancion, status AS estado, count(*) FROM sanctions GROUP BY type, status ORDER BY type, status;
SELECT status AS estado_reserva, count(*) FROM reservations GROUP BY status ORDER BY status;
SELECT to_char(checked_out_at AT TIME ZONE 'America/Lima', 'YYYY-MM') AS mes, count(*) AS prestamos
FROM loans GROUP BY 1 ORDER BY 1;
