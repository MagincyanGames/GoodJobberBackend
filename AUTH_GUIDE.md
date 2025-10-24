# 🔐 Sistema de Autenticación con JWT

## 📋 Resumen

Se ha implementado un sistema de autenticación completo usando **JSON Web Tokens (JWT)** para proteger los endpoints que requieren autorización.

## 🎯 Reglas de Acceso

### 📖 Endpoints Públicos (No requieren autenticación)

Cualquiera puede acceder:

- ✅ `GET /api/users` - Listar todos los usuarios
- ✅ `GET /api/users/:userId/goodjobs` - Ver GoodJobs de un usuario
- ✅ `GET /api/users/:userId/goodjobs/count` - Contar GoodJobs de un usuario
- ✅ `GET /api/goodjobs/:id` - Ver detalles de un GoodJob

### 🔒 Endpoints Protegidos (Requieren autenticación)

Solo usuarios autenticados:

- 🔐 `GET /api/auth/me` - Obtener información del usuario autenticado
- 🔐 `POST /api/goodjobs` - Crear un GoodJob
- 🔐 `POST /api/goodjobs/transfer` - Transferir un GoodJob (solo el propietario)

### 🆕 Endpoints de Autenticación

- 📝 `POST /api/auth/register` - Registrar un nuevo usuario
- 🔑 `POST /api/auth/login` - Iniciar sesión
- 👤 `GET /api/auth/me` - Obtener perfil del usuario autenticado (requiere token)
- ✅ `GET /api/auth/verify` - Verificar validez del token JWT (requiere token)

## 🚀 Cómo Usar

### 1. Registrar un Usuario

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "password": "mySecurePassword123"
}
```

**Respuesta:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Iniciar Sesión

```bash
POST /api/auth/login
Content-Type: application/json

{
  "name": "John Doe",
  "password": "mySecurePassword123"
}
```

**Respuesta:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Obtener Información del Usuario Autenticado

Con el token, puedes obtener tu información y tus GoodJobs:

```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe"
  },
  "goodJobsCount": 5
}
```

**Con lista de GoodJobs:**

```bash
GET /api/auth/me?includeGoodJobs=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe"
  },
  "goodJobsCount": 5,
  "goodJobs": [
    {
      "id": 1,
      "generatedDate": "2025-10-24T10:00:00.000Z",
      "currentOwner": {
        "id": 1,
        "name": "John Doe"
      },
      "lastTransferDate": "2025-10-24T10:30:00.000Z"
    }
  ]
}
```

### 4. Verificar Token JWT

Puedes verificar si tu token es válido y ver cuánto tiempo le queda:

```bash
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**

```json
{
  "success": true,
  "valid": true,
  "user": {
    "userId": 1,
    "name": "John Doe",
    "iat": 1730040000,
    "exp": 1730644800
  },
  "expiresIn": "6d 23h 45m"
}
```

**Si el token es inválido:**

```json
{
  "success": true,
  "valid": false,
  "message": "Token is invalid or missing"
}
```

### 5. Usar el Token en Requests Protegidos

Para endpoints protegidos, incluye el token en el header `Authorization`:

```bash
POST /api/goodjobs/transfer
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "goodJobId": 1,
  "fromUserId": 1,
  "toUserId": 2
}
```

## 🔒 Validaciones de Seguridad

### Transferencia de GoodJobs

Cuando transfieres un GoodJob, el sistema verifica:

1. ✅ **Autenticación**: Debes estar logueado (token válido)
2. ✅ **Autorización**: Solo puedes transferir GoodJobs que te pertenecen
3. ✅ **Validación**: `fromUserId` debe coincidir con tu ID de usuario

**Ejemplo de error si intentas transferir un GoodJob que no te pertenece:**

```json
{
  "success": false,
  "message": "You can only transfer GoodJobs that you own"
}
```

## 🛠️ Estructura Técnica

### JWT Payload

El token JWT contiene:

```typescript
{
  userId: number; // ID del usuario
  name: string; // Nombre del usuario
  iat: number; // Timestamp de emisión
  exp: number; // Timestamp de expiración (7 días)
}
```

### Hashing de Contraseñas

Las contraseñas se hashean usando **SHA-256** con Web Crypto API:

- ✅ Nunca se almacenan contraseñas en texto plano
- ✅ Compatible con Cloudflare Workers
- ⚠️ Para producción, considera usar bcrypt o argon2 con Workers KV

### Middleware de Autenticación

El middleware `authMiddleware`:

1. Lee el header `Authorization`
2. Extrae el token JWT
3. Verifica y decodifica el token
4. Inyecta el usuario en el contexto (`c.set('user', payload)`)

## 📝 Ejemplos Completos

### Flujo Completo de Usuario

```bash
# 1. Registrar usuario
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "password": "alice123"
  }'

# Guarda el token de la respuesta
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Crear un GoodJob (requiere auth)
curl -X POST http://localhost:8787/api/goodjobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "initialOwnerId": 1
  }'

# 3. Ver GoodJobs (público)
curl http://localhost:8787/api/users/1/goodjobs

# 4. Transferir GoodJob (requiere auth y ser propietario)
curl -X POST http://localhost:8787/api/goodjobs/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goodJobId": 1,
    "fromUserId": 1,
    "toUserId": 2
  }'
```

### Usando JavaScript/TypeScript

```typescript
// 1. Login
const loginResponse = await fetch("http://localhost:8787/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Alice",
    password: "alice123",
  }),
});

const { token } = await loginResponse.json();

// 2. Transferir GoodJob (con token)
const transferResponse = await fetch(
  "http://localhost:8787/api/goodjobs/transfer",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      goodJobId: 1,
      fromUserId: 1,
      toUserId: 2,
    }),
  }
);

const result = await transferResponse.json();
console.log(result);
```

## 🔧 Configuración

### JWT Secret

El secret para firmar tokens se configura en `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "JWT_SECRET": "your-super-secret-jwt-key-change-this-in-production"
  }
}
```

⚠️ **IMPORTANTE**:

- Cambia este secret en producción
- Usa un valor aleatorio y seguro
- Nunca commits el secret en el código

### Usar Secrets en Producción

Para producción, usa Cloudflare Secrets:

```bash
# Establecer secret en producción
wrangler secret put JWT_SECRET
# Ingresa tu secret cuando te lo pida

# Verificar
wrangler secret list
```

## 📊 Códigos de Estado HTTP

| Código | Significado                                      |
| ------ | ------------------------------------------------ |
| 200    | ✅ Éxito                                         |
| 401    | 🔒 No autenticado (token inválido o no presente) |
| 403    | 🚫 No autorizado (no eres el propietario)        |
| 404    | ❓ Recurso no encontrado                         |

## 🎓 Mejores Prácticas

### 1. Almacenar el Token

```typescript
// ✅ Bueno - en localStorage o sessionStorage
localStorage.setItem("authToken", token);

// ❌ Malo - en cookies sin httpOnly (vulnerable a XSS)
document.cookie = `token=${token}`;
```

### 2. Incluir Token en Requests

```typescript
// ✅ Bueno - en header Authorization
headers: {
  'Authorization': `Bearer ${token}`
}

// ❌ Malo - en query string (visible en logs)
`/api/endpoint?token=${token}`
```

### 3. Manejar Expiración

```typescript
// Verificar si el token expiró
const payload = JSON.parse(atob(token.split(".")[1]));
const isExpired = payload.exp * 1000 < Date.now();

if (isExpired) {
  // Pedir login nuevamente
  redirectToLogin();
}
```

## 🔄 Renovación de Tokens

Actualmente los tokens duran **7 días**. Cuando expire:

1. El usuario debe hacer login nuevamente
2. Se genera un nuevo token
3. El token viejo deja de funcionar

## 🛡️ Seguridad Adicional

### Recomendaciones para Producción:

1. ✅ Usa HTTPS siempre
2. ✅ Implementa rate limiting
3. ✅ Agrega refresh tokens
4. ✅ Implementa logout (blacklist de tokens)
5. ✅ Usa bcrypt o argon2 para passwords
6. ✅ Agrega 2FA (autenticación de dos factores)

## 📚 Archivos Creados

- `src/services/AuthService.ts` - Servicio de autenticación (JWT, hashing)
- `src/middleware/auth.ts` - Middleware de autenticación
- `src/controllers/userRegister.ts` - Endpoint de registro
- `src/controllers/userLogin.ts` - Endpoint de login
- `src/controllers/goodJobTransfer.ts` - Actualizado con validación

## ✅ Testing

### Test Manual

1. Registrar un usuario
2. Obtener el token
3. Intentar transferir sin token → 401
4. Intentar transferir con token pero GoodJob de otro → 403
5. Transferir tu propio GoodJob → 200 ✅

### Test con Postman/Insomnia

Importa esta colección:

```json
{
  "name": "GoodJob API with Auth",
  "requests": [
    {
      "name": "Register",
      "method": "POST",
      "url": "{{baseUrl}}/api/auth/register",
      "body": {
        "name": "Test User",
        "password": "test123"
      }
    },
    {
      "name": "Login",
      "method": "POST",
      "url": "{{baseUrl}}/api/auth/login",
      "body": {
        "name": "Test User",
        "password": "test123"
      }
    },
    {
      "name": "Transfer GoodJob",
      "method": "POST",
      "url": "{{baseUrl}}/api/goodjobs/transfer",
      "headers": {
        "Authorization": "Bearer {{token}}"
      },
      "body": {
        "goodJobId": 1,
        "fromUserId": 1,
        "toUserId": 2
      }
    }
  ]
}
```

---

**¡El sistema de autenticación está listo para usar!** 🎉

Para más información, consulta:

- [EXAMPLES.md](./EXAMPLES.md)
- [OPTIMIZATION.md](./OPTIMIZATION.md)
