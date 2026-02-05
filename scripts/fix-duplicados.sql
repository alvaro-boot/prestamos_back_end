-- Ejecutar este script para corregir el error "Duplicate entry" en frecuencia_pago
-- Cambia "prestamos" por tu DATABASE_NAME si es diferente
-- Ejecutar: mysql -u root -p prestamos < scripts/fix-duplicados.sql

USE prestamos;

-- OPCIÓN A: Eliminar duplicados (mantener solo el de menor id por cada codigo)
DELETE fp1 FROM frecuencia_pago fp1
INNER JOIN frecuencia_pago fp2
WHERE fp1.codigo = fp2.codigo AND fp1.id > fp2.id;

DELETE r1 FROM roles r1
INNER JOIN roles r2
WHERE r1.codigo = r2.codigo AND r1.id > r2.id;

-- OPCIÓN B: Si lo anterior falla, vaciar y dejar que el seed repueble (solo si no tienes préstamos)
-- TRUNCATE TABLE frecuencia_pago;
-- TRUNCATE TABLE roles;

SELECT 'Duplicados eliminados. Reinicia la app.' AS resultado;
