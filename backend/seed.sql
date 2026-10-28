DELETE FROM usuarios;
DELETE FROM items_inventario;

INSERT INTO usuarios (email, password_hash, nombre, rol, estado_cuenta) VALUES
('admin@unsa.edu.pe', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Admin Principal', 'ADMINISTRADOR_SISTEMA', 'ACTIVA'),
('marmendarizp@unsa.edu.pe', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'Marco Armendariz', 'ESTUDIANTE', 'ACTIVA');

INSERT INTO items_inventario (codigo_patrimonial, nombre, descripcion, tipo_item, estado_fisico, disponibilidad) VALUES
('EQU-01', 'Cable HDMI 5m', 'Cable alta velocidad', 'EQUIPO', 'BUENO', 'DISPONIBLE'),
('EQU-02', 'Microfono Inalambrico Shure', 'Microfono de mano UHF', 'EQUIPO', 'BUENO', 'DISPONIBLE'),
('LIB-10', 'Sistemas Operativos - Tanenbaum', 'Libro texto oficial', 'LIBRO', 'REGULAR', 'DISPONIBLE');
