-- Corrige usuario_id antes de que TypeORM agregue la FK
-- Asegura que usuarios tenga id=1 y que clientes/prestamos referencien correctamente

-- 1. Asegurar que exista el usuario admin (id=1)
INSERT IGNORE INTO usuarios (id, email, password_hash, nombre, activo, fecha_creacion) VALUES
(1, 'admin@ejemplo.com', '$2b$10$aQkHz6/TxzkJStdeNjk38uIcMn8t37aGOF468e/uTAy0SdsRz5ULa', 'Administrador', 1, NOW());

INSERT IGNORE INTO usuarios_roles (usuario_id, rol_id) VALUES (1, 1);

-- 2. Asignar usuario_id=1 a todos los clientes con valor inválido
UPDATE clientes SET usuario_id = 1 WHERE usuario_id IS NULL OR usuario_id = 0;

-- 3. Asignar usuario_id=1 a todos los préstamos con valor inválido
UPDATE prestamos SET usuario_id = 1 WHERE usuario_id IS NULL OR usuario_id = 0;
