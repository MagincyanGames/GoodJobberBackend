# GoodJob Backend API

API backend para el sistema GoodJob, construido con Cloudflare Workers, OpenAPI 3.1, [chanfana](https://github.com/cloudflare/chanfana) y [Hono](https://github.com/honojs/hono).

## 🚀 Características

- ✅ OpenAPI 3.1 con documentación automática
- ✅ Autenticación JWT
- ✅ Sistema de roles (Admin/Usuario)
- ✅ ORM con Drizzle
- ✅ Base de datos D1 (SQLite en Cloudflare)
- ✅ Validación de requests con Zod
- ✅ Swagger UI integrado

## 📋 Requisitos Previos

1. Cuenta de [Cloudflare Workers](https://workers.dev) (el tier gratuito es suficiente)
2. Node.js 18+ instalado
3. npm o yarn

## 🔧 Instalación

1. Clona el proyecto e instala dependencias:

```bash
git clone <repo-url>
cd good-job-backend
npm install
```

2. Inicia sesión en Cloudflare:

```bash
npx wrangler login
```

3. Crea la base de datos D1:

```bash
npx wrangler d1 create good_job_db
```

4. Actualiza `wrangler.jsonc` con el ID de tu base de datos.

5. **Configura los secretos para desarrollo:**

```bash
# Copia el archivo de ejemplo
cp .dev.vars.example .dev.vars

# Edita .dev.vars y configura JWT_SECRET
# Puedes generar un secret seguro con:
# PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
# Linux/Mac: openssl rand -base64 32
```

6. Ejecuta las migraciones (incluye la creación del usuario admin):

```bash
npm run migrate
```

## 🔐 Seguridad

El sistema garantiza que siempre haya un usuario administrador mediante **dos mecanismos**:

### 1. Usuario Admin Pre-creado (Migración)

Al ejecutar las migraciones, se crea automáticamente:

```
Usuario: admin
Contraseña: admin123
```

⚠️ **IMPORTANTE**: Cambia esta contraseña después del primer login.

### 2. Primer Registro Automático

Si la base de datos está vacía, el **primer usuario** que se registre será automáticamente administrador. Todos los registros posteriores serán usuarios normales.

**Ejemplo:**

```bash
# Si no hay usuarios en la BD, este será admin
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "mi_admin", "password": "password123"}'
```

Para más información, consulta:

- [SECURITY.md](./SECURITY.md) - Guía completa de seguridad
- [MIGRATION_SUCCESS.md](./MIGRATION_SUCCESS.md) - Resultado de la migración

## 🏗️ Estructura del Proyecto

```
src/
├── controllers/      # Endpoints de la API
├── db/              # Schema y cliente de base de datos
├── middleware/      # Middleware de autenticación
├── repositories/    # Capa de acceso a datos
├── services/        # Lógica de negocio
└── types/           # Tipos TypeScript
```

## 📚 Documentación

- [SECRETOS.md](./SECRETOS.md) - **Guía de configuración de secretos y variables de entorno**
- [QUICK_START.md](./QUICK_START.md) - Guía rápida
- [SECURITY.md](./SECURITY.md) - Guía de seguridad
- [AUTH_GUIDE.md](./AUTH_GUIDE.md) - Guía de autenticación
- [DRIZZLE_GUIDE.md](./DRIZZLE_GUIDE.md) - Guía de Drizzle ORM
- [TRANSACTIONS_GUIDE.md](./TRANSACTIONS_GUIDE.md) - Guía de transacciones
- [MIGRATION_SUCCESS.md](./MIGRATION_SUCCESS.md) - Estado actual y cómo usar el sistema

## 🛠️ Desarrollo

1. Inicia el servidor local:

```bash
npm run dev
```

2. Abre `http://localhost:8787/` para ver la interfaz Swagger.

3. Los cambios en `src/` recargarán automáticamente el servidor.

## 📡 Endpoints Principales

### Autenticación (No requiere token)

- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Iniciar sesión

### Autenticación (Requiere token)

- `GET /api/auth/me` - Obtener usuario actual
- `GET /api/auth/verify` - Verificar token

### Usuarios (Admin only)

- `POST /api/users` - Crear usuario (requiere ser admin)

### GoodJobs

- `POST /api/goodjobs` - Crear GoodJob (requiere autenticación)
- `POST /api/goodjobs/transfer` - Transferir GoodJob (requiere autenticación)
- `GET /api/goodjobs/:id` - Obtener GoodJob
- `GET /api/users/:userId/goodjobs` - Listar GoodJobs de un usuario
- `GET /api/users/:userId/goodjobs/count` - Contar GoodJobs de un usuario

## 🚢 Despliegue

1. Asegúrate de haber ejecutado las migraciones:

```bash
npm run migrate
```

2. Despliega a Cloudflare Workers:

```bash
npx wrangler deploy
```

3. **Cambia la contraseña del admin inmediatamente** (ver [SECURITY.md](./SECURITY.md)).

## 🔑 Variables de Entorno y Secretos

### Para Desarrollo Local

Cloudflare Workers usa `.dev.vars` (NO `.env`):

```bash
# 1. Copia el archivo de ejemplo
cp .dev.vars.example .dev.vars

# 2. Edita .dev.vars y configura tu JWT_SECRET
JWT_SECRET=tu-secret-generado-aqui
```

### Para Producción

Usa `wrangler secret` para configurar secretos de forma segura:

```bash
# Configurar JWT_SECRET en producción
npx wrangler secret put JWT_SECRET
# Ingresa el valor cuando te lo pida (no se mostrará)
```

⚠️ **NUNCA** pongas secretos en `wrangler.jsonc` bajo `"vars"` porque se commitean al repositorio.

📖 **Más información:** Ver [SECRETOS.md](./SECRETOS.md) para una guía completa.

## 📝 Licencia

MIT
