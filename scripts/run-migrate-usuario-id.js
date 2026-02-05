/**
 * Ejecuta la migración usuario_id usando mysql2 (no requiere mysql CLI)
 * Ejecutar: node scripts/run-migrate-usuario-id.js
 */
const path = require('path');
const fs = require('fs');

// Cargar .env manualmente
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
}

const mysql = require('mysql2/promise');

async function runMigration() {
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME || 'prestamos',
    multipleStatements: true,
  };

  const conn = await mysql.createConnection(config);

  try {
    // Ejecutar fix primero (asegura admin y corrige usuario_id inválidos)
    const fixPath = path.join(__dirname, 'fix-usuario-id.sql');
    if (fs.existsSync(fixPath)) {
      const fixSql = fs.readFileSync(fixPath, 'utf8');
      const fixStmts = fixSql
        .split(';')
        .map((s) => s.replace(/--.*$/gm, '').trim())
        .filter((s) => s.length > 0);
      for (const stmt of fixStmts) {
        try {
          await conn.query(stmt + ';');
        } catch (err) {
          if (
            err.code !== 'ER_BAD_FIELD_ERROR' &&
            err.code !== 'ER_NO_SUCH_TABLE'
          ) {
            console.log('  Fix:', err.message);
          }
        }
      }
    }

    const sqlPath = path.join(__dirname, 'migrate-usuario-id.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = sql
      .split(';')
      .map((s) => s.replace(/--.*$/gm, '').trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      try {
        await conn.query(stmt + ';');
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
          console.log('  (omitido: ya existe)');
        } else {
          throw err;
        }
      }
    }
    console.log('✓ Migración usuario_id ejecutada correctamente.');
    console.log(
      '  clientes y prestamos tienen usuario_id asignado al admin (id=1).',
    );
  } finally {
    await conn.end();
  }
}

runMigration().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
