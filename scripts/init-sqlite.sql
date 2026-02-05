-- Base de datos SQLite para Sistema de Préstamos
-- Ejecutar: sqlite3 prestamos.db < scripts/init-sqlite.sql

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(100)
);

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(150),
    activo INTEGER DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL
);

-- Usuarios-Roles
CREATE TABLE IF NOT EXISTS usuarios_roles (
    usuario_id INTEGER NOT NULL,
    rol_id INTEGER NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Frecuencia de pago
CREATE TABLE IF NOT EXISTS frecuencia_pago (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(100),
    cuotas_por_mes INTEGER DEFAULT 1
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    documento VARCHAR(20) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo INTEGER DEFAULT 1,
    deleted_at DATETIME NULL,
    UNIQUE(usuario_id, documento),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Préstamos
CREATE TABLE IF NOT EXISTS prestamos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK(estado IN ('ACTIVO','CANCELADO','REFINANCIADO','PAGADO')),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Versiones de préstamo
CREATE TABLE IF NOT EXISTS prestamo_versiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prestamo_id INTEGER NOT NULL,
    frecuencia_pago_id INTEGER NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    interes_porcentaje DECIMAL(5,2) NOT NULL,
    plazo_meses INTEGER NOT NULL,
    monto_total DECIMAL(15,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    FOREIGN KEY (prestamo_id) REFERENCES prestamos(id),
    FOREIGN KEY (frecuencia_pago_id) REFERENCES frecuencia_pago(id)
);

-- Cuotas
CREATE TABLE IF NOT EXISTS cuotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prestamo_id INTEGER NOT NULL,
    prestamo_version_id INTEGER NOT NULL,
    numero_cuota INTEGER NOT NULL,
    monto_cuota DECIMAL(15,2) NOT NULL,
    saldo_cuota DECIMAL(15,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK(estado IN ('PENDIENTE','PAGADA','VENCIDA','PARCIAL','REFINANCIADA')),
    FOREIGN KEY (prestamo_id) REFERENCES prestamos(id),
    FOREIGN KEY (prestamo_version_id) REFERENCES prestamo_versiones(id)
);

-- Pagos
CREATE TABLE IF NOT EXISTS pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prestamo_id INTEGER NOT NULL,
    cuota_id INTEGER,
    monto_pagado DECIMAL(15,2) NOT NULL,
    metodo_pago VARCHAR(30),
    referencia VARCHAR(100),
    observacion TEXT,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prestamo_id) REFERENCES prestamos(id),
    FOREIGN KEY (cuota_id) REFERENCES cuotas(id)
);

-- Historial préstamo
CREATE TABLE IF NOT EXISTS historial_prestamo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prestamo_id INTEGER NOT NULL,
    accion VARCHAR(50) NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    observacion TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prestamo_id) REFERENCES prestamos(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prestamos_cliente ON prestamos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_prestamo ON cuotas(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_pagos_prestamo ON pagos(prestamo_id);

-- ========== DATOS INICIALES ==========

INSERT OR IGNORE INTO roles (id, codigo, descripcion) VALUES
(1, 'ADMIN', 'Administrador'),
(2, 'COBRADOR', 'Cobrador'),
(3, 'CONSULTA', 'Solo consulta');

INSERT OR IGNORE INTO frecuencia_pago (id, codigo, descripcion, cuotas_por_mes) VALUES
(1, 'MENSUAL', 'Mensual', 1),
(2, 'QUINCENAL', 'Quincenal', 2);

-- Usuario admin: admin@ejemplo.com / admin123
INSERT OR IGNORE INTO usuarios (id, email, password_hash, nombre, activo) VALUES
(1, 'admin@ejemplo.com', '$2b$10$aQkHz6/TxzkJStdeNjk38uIcMn8t37aGOF468e/uTAy0SdsRz5ULa', 'Administrador', 1);

INSERT OR IGNORE INTO usuarios_roles (usuario_id, rol_id) VALUES (1, 1);

-- Clientes de ejemplo (usuario admin id=1)
INSERT OR IGNORE INTO clientes (id, usuario_id, documento, nombre, email, telefono, direccion) VALUES
(1, 1, '12345678', 'Juan Pérez', 'juan@ejemplo.com', '3001234567', 'Calle 1 #2-3'),
(2, 1, '87654321', 'María García', 'maria@ejemplo.com', '3109876543', 'Carrera 5 #10-20'),
(3, 1, '11223344', 'Carlos López', 'carlos@ejemplo.com', '3205551234', 'Av. Principal 100');

-- Préstamo de ejemplo: 100.000 COP, 10% mensual, 1 mes, quincenal
-- Total = 100.000 + 10.000 = 110.000 | Cuota = 110.000/2 = 55.000 por quincena
INSERT OR IGNORE INTO prestamos (id, usuario_id, cliente_id, estado) VALUES (1, 1, 1, 'ACTIVO');

INSERT OR IGNORE INTO prestamo_versiones (id, prestamo_id, frecuencia_pago_id, monto, interes_porcentaje, plazo_meses, monto_total, fecha_inicio) VALUES
(1, 1, 2, 100000, 10, 1, 110000, '2025-01-01');

-- Cuotas quincenales: 55.000 cada 15 días
INSERT OR IGNORE INTO cuotas (prestamo_id, prestamo_version_id, numero_cuota, monto_cuota, saldo_cuota, fecha_vencimiento, estado) VALUES
(1, 1, 1, 55000, 55000, '2025-01-16', 'PENDIENTE'),
(1, 1, 2, 55000, 55000, '2025-02-01', 'PENDIENTE');

INSERT OR IGNORE INTO historial_prestamo (prestamo_id, accion, estado_nuevo, observacion) VALUES
(1, 'CREACION', 'ACTIVO', 'Préstamo creado');
