import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// Render inyecta DATABASE_URL cuando vinculas un Postgres. Úsala si existe.
const databaseUrl = process.env.DATABASE_URL;

export const databaseConfig: TypeOrmModuleOptions = databaseUrl
  ? {
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }
  : {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'prestamos_db',
      ssl:
        process.env.DATABASE_SSL !== 'false'
          ? { rejectUnauthorized: false }
          : false,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    };
