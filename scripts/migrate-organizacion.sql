-- Migración: Multi-tenant por organización
-- Ejecutar en BD existente antes de actualizar el backend.
-- MySQL: mysql -u root -p prestamos_db < scripts/migrate-organizacion.sql
-- PostgreSQL: psql $DATABASE_URL -f scripts/migrate-organizacion.sql

-- 1. Usuarios: agregar organizacion_id
ALTER TABLE usuarios ADD COLUMN organizacion_id BIGINT NULL;
UPDATE usuarios u
SET organizacion_id = u.id
WHERE EXISTS (SELECT 1 FROM usuarios_roles ur WHERE ur.usuario_id = u.id AND ur.rol_id = 1);
UPDATE usuarios SET organizacion_id = 1 WHERE organizacion_id IS NULL;

-- 2. Clientes: agregar organizacion_id y migrar
ALTER TABLE clientes ADD COLUMN organizacion_id BIGINT NULL;
UPDATE clientes SET organizacion_id = usuario_id;
ALTER TABLE clientes DROP FOREIGN KEY IF EXISTS clientes_ibfk_1;
ALTER TABLE clientes DROP INDEX idx_clientes_usuario;
ALTER TABLE clientes DROP INDEX idx_clientes_usuario_documento;
ALTER TABLE clientes DROP COLUMN usuario_id;
ALTER TABLE clientes MODIFY organizacion_id BIGINT NOT NULL;
ALTER TABLE clientes ADD INDEX idx_clientes_organizacion (organizacion_id);
ALTER TABLE clientes ADD UNIQUE INDEX idx_clientes_organizacion_documento (organizacion_id, documento);

-- 3. Préstamos: agregar organizacion_id y migrar (desde cliente)
ALTER TABLE prestamos ADD COLUMN organizacion_id BIGINT NULL;
UPDATE prestamos p
JOIN clientes c ON p.cliente_id = c.id
SET p.organizacion_id = c.organizacion_id;
UPDATE prestamos SET organizacion_id = 1 WHERE organizacion_id IS NULL;
ALTER TABLE prestamos DROP FOREIGN KEY IF EXISTS prestamos_ibfk_1;
ALTER TABLE prestamos DROP INDEX idx_prestamos_usuario;
ALTER TABLE prestamos DROP COLUMN usuario_id;
ALTER TABLE prestamos MODIFY organizacion_id BIGINT NOT NULL;
ALTER TABLE prestamos ADD INDEX idx_prestamos_organizacion (organizacion_id);
