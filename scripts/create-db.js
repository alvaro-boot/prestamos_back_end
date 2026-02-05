/**
 * Script para crear prestamos.db (SQLite) con datos iniciales
 * Ejecutar: node scripts/create-db.js
 */
const fs = require('fs');
const path = require('path');

async function createDb() {
  let initSqlJs;
  try {
    initSqlJs = require('sql.js');
  } catch {
    console.log('Instalando sql.js...');
    const { execSync } = require('child_process');
    execSync('npm install sql.js --no-save', { stdio: 'inherit' });
    initSqlJs = require('sql.js');
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  const sqlPath = path.join(__dirname, 'init-sqlite.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  db.exec(sql);

  const data = db.export();
  const buffer = Buffer.from(data);
  const outPath = path.join(__dirname, '..', 'prestamos.db');
  fs.writeFileSync(outPath, buffer);
  db.close();

  console.log('✓ Base de datos creada: prestamos.db');
  console.log('  Usuario: admin@ejemplo.com / admin123');
  console.log('  Clientes: 3 de ejemplo');
  console.log(
    '  Préstamo: 100.000 COP, 10% mensual, 2 cuotas quincenales de 55.000',
  );
}

createDb().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
