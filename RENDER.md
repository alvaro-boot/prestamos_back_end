# Despliegue en Render

## Variables de entorno requeridas

### Opción A: Base de datos vinculada (recomendado)
Si vinculaste el servicio PostgreSQL al backend en Render, **DATABASE_URL** se inyecta automáticamente. No necesitas configurar nada más.

### Opción B: Variables manuales
Si no vinculaste la base de datos, agrega en Render → tu servicio → Environment:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_HOST` | `dpg-d62cacali9vc73c6ps50-a` | Host **interno** (cuando backend y DB están en Render) |
| `DATABASE_PORT` | `5432` | Puerto PostgreSQL |
| `DATABASE_USER` | `prestamos_mn4e_user` | Usuario de la BD |
| `DATABASE_PASSWORD` | *(tu contraseña)* | Contraseña de la BD |
| `DATABASE_NAME` | `prestamos_mn4e` | Nombre de la base de datos |
| `DATABASE_SSL` | `false` | Para conexión interna en Render |
| `NODE_ENV` | `production` | Modo producción |
| `JWT_SECRET` | *(clave segura)* | Clave para JWT |

**Importante:** Usa el host **interno** (`dpg-d62cacali9vc73c6ps50-a`) cuando el backend corre en Render. El host externo solo es para conexiones desde tu PC.

## Puerto
Render asigna `PORT` automáticamente. La app ya usa `process.env.PORT`.
