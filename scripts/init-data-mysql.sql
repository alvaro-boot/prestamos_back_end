-- Datos iniciales para MySQL (Sistema de Préstamos)
-- Ejecutar después de crear la BD: mysql -u root -p prestamos_db < scripts/init-data-mysql.sql
-- O importar desde MySQL Workbench / cliente SQL

-- Crear BD si no existe
CREATE DATABASE IF NOT EXISTS prestamos_db;
USE prestamos_db;

-- Roles
INSERT IGNORE INTO roles (id, codigo, descripcion) VALUES
(1, 'ADMIN', 'Administrador'),
(2, 'COBRADOR', 'Cobrador'),
(3, 'CONSULTA', 'Solo consulta');

-- Frecuencia de pago
INSERT IGNORE INTO frecuencia_pago (id, codigo, descripcion, cuotas_por_mes) VALUES
(1, 'MENSUAL', 'Mensual', 1),
(2, 'QUINCENAL', 'Quincenal', 2);

-- Usuario admin: admin@ejemplo.com / admin123 (organizacion_id = id para admins)
INSERT IGNORE INTO usuarios (id, email, password_hash, nombre, activo, organizacion_id) VALUES
(1, 'admin@ejemplo.com', '$2b$10$aQkHz6/TxzkJStdeNjk38uIcMn8t37aGOF468e/uTAy0SdsRz5ULa', 'Administrador', TRUE, 1);

INSERT IGNORE INTO usuarios_roles (usuario_id, rol_id) VALUES (1, 1);

-- Clientes de ejemplo (organizacion_id = 1, org del admin)
INSERT IGNORE INTO clientes (id, organizacion_id, documento, nombre, email, telefono, direccion) VALUES
(1, 1, '12345678', 'Juan Pérez', 'juan@ejemplo.com', '3001234567', 'Calle 1 #2-3'),
(2, 1, '87654321', 'María García', 'maria@ejemplo.com', '3109876543', 'Carrera 5 #10-20'),
(3, 1, '11223344', 'Carlos López', 'carlos@ejemplo.com', '3205551234', 'Av. Principal 100');
