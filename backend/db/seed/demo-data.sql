-- Datos de demostración: alumnos de la clase, docentes, administrativos, inventario y 5 préstamos vigentes el 2-dic-2026.
--
-- Ejecutar DESPUÉS de arrancar el backend al menos una vez (Flyway crea las tablas y las categorías):
--   docker exec -i loans-db psql -U loans -d loans -v ON_ERROR_STOP=1 < backend/db/seed/demo-data.sql
--
-- Es idempotente: si un usuario (correo o código) o un ítem (código) ya existe, se omite; no duplica nada.
-- Todos los usuarios nuevos entran con la contraseña inicial  Unsa2026  (cámbienla desde el perfil).
-- Los préstamos se registran como entregados por el primer ADMIN/MANAGER existente.
BEGIN;

-- ---------- Usuarios (48 alumnos, 5 docentes, 2 administrativos) ----------
INSERT INTO users (first_name, last_name, email, document_number, password_hash, role, active, created_at, updated_at) VALUES
    ('Jesus Alberto', 'Alfaro Buiza', 'jafarob@unsa.edu.pe', '20232283', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Marco Antonio', 'Armendariz Paredes', 'marmendariz@unsa.edu.pe', '20233375', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Albert Gussepe', 'Blanco Cana', 'ablancoc@unsa.edu.pe', '20200719', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Karina Paola', 'Calcina Chuquipalla', 'kcalcinac@unsa.edu.pe', '20243472', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Diego', 'Canqui Ecos', 'dcanqui@unsa.edu.pe', '20243465', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Anderson Samuel', 'Carpio Chura', 'acarpioch@unsa.edu.pe', '20213148', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Moises Robert', 'Ccaso Idme', 'mccasoi@unsa.edu.pe', '20240826', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Elyud Edgar', 'Chayña Calcina', 'echaynac@unsa.edu.pe', '20240827', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Luis Antonio', 'Chipana Chura', 'lchipanac@unsa.edu.pe', '20223114', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Aldair Daniel', 'Condori Ataucuri', 'acondoriat@unsa.edu.pe', '20233580', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Emilio Alejandro', 'Condori Pallardel', 'econdoripa@unsa.edu.pe', '20240845', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Stephano Gian Pierre', 'Delgado Chavez', 'sdelgadoch@unsa.edu.pe', '20242427', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Mauricio Alejandro', 'Farfan Huayta', 'mfarfanhu@unsa.edu.pe', '20200736', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Carlos Enrique', 'Gutierrez Castilla', 'cgutierrezca@unsa.edu.pe', '20240831', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Johan Diego', 'Huamani Sabina', 'jhuamanisab@unsa.edu.pe', '20242426', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Estrella de Jesús Emilia Fabiana', 'Huarsaya Márquez', 'ehuarsaya@unsa.edu.pe', '20240834', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Lizzy Arlette', 'Huayhua Perez', 'lhuayhuape@unsa.edu.pe', '20240829', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Roid Niro', 'Huaylla Guzman', 'rhuayllag@unsa.edu.pe', '20240835', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Daysi', 'Jara Arisaca', 'djaraa@unsa.edu.pe', '20232278', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Hellen Grace', 'Juan de Dios Delgado', 'hjuandedios@unsa.edu.pe', '20233584', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Natalie Marleny', 'Lazo Paxi', 'nlazop@unsa.edu.pe', '20213147', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Fernando Enrique', 'Llosa Manchego', 'fllosam@unsa.edu.pe', '20233591', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Mariana Valery', 'Luis Jimenez', 'mluisj@unsa.edu.pe', '20223084', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Diego de Alessandro', 'Mamani Salazar', 'dmamanisal@unsa.edu.pe', '20243469', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Luis Fernando', 'Morales Tacca', 'lmoralest@unsa.edu.pe', '20153703', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Neill Elverth', 'Olazabal Chavez', 'nolazabalc@unsa.edu.pe', '20210680', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Alvaro Johan', 'Panibra Choctaya', 'apanibrach@unsa.edu.pe', '20151100', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Javier Alonzo', 'Peñalva Humire', 'jpenalvah@unsa.edu.pe', '20152574', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Jesus Gustavo', 'Perez Villasante', 'jperezvil@unsa.edu.pe', '20240839', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Juan Carlos', 'Postigo Cabana', 'jpostigo@unsa.edu.pe', '20162924', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Claudia Roxana', 'Quisocala Cruz', 'cquisocalac@unsa.edu.pe', '20172351', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Sharmely Yesenia', 'Quispe Chavez', 'squispechav@unsa.edu.pe', '20151600', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('David Augusto', 'Quispe Lloccallasi', 'dquispello@unsa.edu.pe', '20243473', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Angelo Josue', 'Quispe Suarez', 'aquispesua@unsa.edu.pe', '20243463', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Job Lorenzo', 'Quispe Torrez', 'jquispetor@unsa.edu.pe', '20240841', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Luis Enrique', 'Ramos Chambi', 'lramoscha@unsa.edu.pe', '20220721', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Rodrigo Abraham', 'Ramos Mamani', 'rramosmam@unsa.edu.pe', '20240842', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Omar Joaquin', 'Rivera Olivera', 'oriverao@unsa.edu.pe', '20243468', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Edu Andre', 'Sucari Ccansaya', 'esucari@unsa.edu.pe', '20240828', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Cristhian Luis', 'Taipe Huanca', 'ctaipe@unsa.edu.pe', '20190224', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Lizeth Angelica', 'Tito Vilca', 'ltitov@unsa.edu.pe', '20233592', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Jhair Alejandro', 'Torres Chavez', 'jtorreschav@unsa.edu.pe', '20231499', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Micaela Belen', 'Uribe Zuñiga', 'muribez@unsa.edu.pe', '20222070', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Ronald Reynaldo', 'Valdez Agüero', 'rvaldeza@unsa.edu.pe', '20163274', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Diego Mauricio', 'Villanueva Flores', 'dvillanuevaf@unsa.edu.pe', '20240836', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Eduardo Josue', 'Zela Quispe', 'ezelaquisp@unsa.edu.pe', '20240847', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Fernando Antonio', 'Gama Llicahua', 'fgama@unsa.edu.pe', '20240830', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Marving Alonzo', 'Zamata Huaracha', 'mzamatah@unsa.edu.pe', '20053497', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'STUDENT', TRUE, now(), now()),
    ('Wilber Roberto', 'Ramos Lovon', 'wramos@unsa.edu.pe', '20071142', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'TEACHER', TRUE, now(), now()),
    ('Roxana', 'Flores Quispe', 'rfloresqu@unsa.edu.pe', '20083356', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'TEACHER', TRUE, now(), now()),
    ('Alvaro Henry', 'Mamani Aliaga', 'amamaniali@unsa.edu.pe', '20094781', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'TEACHER', TRUE, now(), now()),
    ('Yuber Elmer', 'Velazco Paredes', 'yvelazco@unsa.edu.pe', '20068925', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'TEACHER', TRUE, now(), now()),
    ('Edgar', 'Sarmiento Calisaya', 'esarmientoca@unsa.edu.pe', '20102237', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'TEACHER', TRUE, now(), now()),
    ('Carmen Rosa', 'Huanca Mendoza', 'chuancam@unsa.edu.pe', '20115608', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'ADMINISTRATIVE', TRUE, now(), now()),
    ('Julio César', 'Paredes Vilca', 'jparedesv@unsa.edu.pe', '20121874', '$2b$10$011lLc2v.SXoGJoEJ03deOdSxVrPNytdqobJ5F2MrAYoe.YguJQIG', 'ADMINISTRATIVE', TRUE, now(), now())
ON CONFLICT DO NOTHING;

-- ---------- Inventario (20 ítems) ----------
INSERT INTO items (code, name, description, category_id, status, created_at, updated_at)
SELECT v.code, v.name, NULL, c.id, 'AVAILABLE', now(), now()
FROM (VALUES
    ('EQ-001', 'Laptop', 'Equipo'),
    ('EQ-002', 'Proyector', 'Equipo'),
    ('EQ-003', 'Mouse inalámbrico', 'Equipo'),
    ('EQ-004', 'Teclado USB', 'Equipo'),
    ('EQ-005', 'Monitor 24"', 'Equipo'),
    ('EQ-006', 'Router WiFi', 'Equipo'),
    ('EQ-007', 'Cable HDMI', 'Equipo'),
    ('EQ-008', 'Extensión eléctrica', 'Equipo'),
    ('LB-001', 'Introduction to Algorithms (Cormen)', 'Libro'),
    ('LB-002', 'Clean Code (Robert C. Martin)', 'Libro'),
    ('LB-003', 'Estructuras de datos y algoritmos en Java', 'Libro'),
    ('LB-004', 'Ingeniería de Software (Sommerville)', 'Libro'),
    ('LB-005', 'Redes de computadoras (Tanenbaum)', 'Libro'),
    ('LB-006', 'Fundamentos de bases de datos (Silberschatz)', 'Libro'),
    ('OB-001', 'Control remoto de proyector', 'Objeto'),
    ('OB-002', 'Plumones para pizarra', 'Objeto'),
    ('OB-003', 'Borrador de pizarra', 'Objeto'),
    ('OB-004', 'Puntero láser', 'Objeto'),
    ('OB-005', 'Adaptador USB-C a HDMI', 'Objeto'),
    ('OB-006', 'Memoria USB 32 GB', 'Objeto')
) AS v(code, name, category)
JOIN categories c ON c.name = v.category
ON CONFLICT DO NOTHING;

-- ---------- 5 préstamos vigentes el 2 de diciembre de 2026 ----------
-- Salida entre 07:30 y 09:00 y vencimiento a las 20:10 (hora de cierre; libros y objetos admiten ese plazo).
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
JOIN items i ON i.code = v.item_code AND i.status = 'AVAILABLE'
JOIN users u ON u.email = v.email
ON CONFLICT DO NOTHING;

-- Los ítems con préstamo sin devolver quedan como prestados
UPDATE items SET status = 'ON_LOAN', updated_at = now()
WHERE status = 'AVAILABLE'
  AND id IN (SELECT item_id FROM loans WHERE returned_at IS NULL);

COMMIT;

-- Verificación rápida
SELECT role, count(*) AS usuarios FROM users GROUP BY role ORDER BY role;
SELECT status, count(*) AS items FROM items GROUP BY status ORDER BY status;
SELECT i.code, i.name, u.email, l.checked_out_at AT TIME ZONE 'America/Lima' AS salida_lima, l.due_at AT TIME ZONE 'America/Lima' AS vence_lima
FROM loans l JOIN items i ON i.id = l.item_id JOIN users u ON u.id = l.user_id WHERE l.returned_at IS NULL ORDER BY i.code;
