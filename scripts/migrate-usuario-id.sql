-- Migración: agregar usuario_id a clientes y prestamos
-- Ejecutar si ya tienes datos existentes. Asigna todo al usuario admin (id=1).

-- 0. Asegurar que exista el usuario admin (id=1) ANTES de agregar FKs
INSERT IGNORE INTO usuarios (id, email, password_hash, nombre, activo, fecha_creacion) VALUES
(1, 'admin@ejemplo.com', '$2b$10$aQkHz6/TxzkJStdeNjk38uIcMn8t37aGOF468e/uTAy0SdsRz5ULa', 'Administrador', 1, NOW());

-- MySQL / MariaDB
ALTER TABLE clientes ADD COLUMN usuario_id BIGINT NULL;
UPDATE clientes SET usuario_id = 1 WHERE usuario_id IS NULL;
ALTER TABLE clientes MODIFY COLUMN usuario_id BIGINT NOT NULL;
ALTER TABLE clientes ADD INDEX idx_clientes_usuario (usuario_id);
ALTER TABLE clientes ADD UNIQUE INDEX idx_clientes_usuario_documento (usuario_id, documento);

ALTER TABLE prestamos ADD COLUMN usuario_id BIGINT NULL;
UPDATE prestamos SET usuario_id = 1 WHERE usuario_id IS NULL;
ALTER TABLE prestamos MODIFY COLUMN usuario_id BIGINT NOT NULL;
ALTER TABLE prestamos ADD INDEX idx_prestamos_usuario (usuario_id);
