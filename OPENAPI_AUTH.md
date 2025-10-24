# 🔐 Cómo Usar la Autenticación en OpenAPI/Swagger

## 📋 Configuración Realizada

La interfaz de OpenAPI/Swagger ahora está configurada para permitir autenticación con JWT de forma global. Esto significa que puedes ingresar tu token **una sola vez** y se aplicará automáticamente a todos los endpoints protegidos.

## 🎯 Pasos para Autenticarte

### 1️⃣ Accede a la Documentación

Abre tu navegador en:

```
http://localhost:8787
```

### 2️⃣ Registra o Inicia Sesión

Primero necesitas obtener un token JWT:

**Opción A: Registrar nuevo usuario**

1. Busca el endpoint `POST /api/auth/register`
2. Click en "Try it out"
3. Ingresa tu nombre y contraseña:

```json
{
  "name": "MiUsuario",
  "password": "miPassword123"
}
```

4. Click en "Execute"
5. **Copia el `token` de la respuesta**

**Opción B: Login con usuario existente**

1. Busca el endpoint `POST /api/auth/login`
2. Click en "Try it out"
3. Ingresa tus credenciales
4. **Copia el `token` de la respuesta**

### 3️⃣ Autorizar en la Interfaz

1. En la parte superior derecha de la página, verás un botón **"Authorize" 🔓**
2. Click en ese botón
3. Se abrirá un modal
4. En el campo `bearerAuth`, pega tu token JWT (sin el prefijo "Bearer")
5. Click en **"Authorize"**
6. Click en **"Close"**

![Authorize Button](https://i.imgur.com/example.png)

### 4️⃣ Usar Endpoints Protegidos

Ahora todos los endpoints protegidos incluirán automáticamente tu token en el header `Authorization: Bearer <tu-token>`.

**Endpoints protegidos:**

- 🔐 `POST /api/goodjobs` - Crear GoodJob
- 🔐 `POST /api/goodjobs/transfer` - Transferir GoodJob

**Endpoints públicos (no requieren token):**

- 📖 `GET /api/users` - Listar usuarios
- 📖 `GET /api/goodjobs/:id` - Ver GoodJob
- 📖 `GET /api/users/:userId/goodjobs` - Ver GoodJobs de usuario
- 📖 `GET /api/users/:userId/goodjobs/count` - Contar GoodJobs

## 🔄 Cerrar Sesión

Para "cerrar sesión" en la interfaz de OpenAPI:

1. Click en el botón **"Authorize" 🔓** nuevamente
2. Click en **"Logout"**
3. El candado volverá a estar abierto 🔓

## 📸 Guía Visual

### Paso 1: Botón Authorize

```
┌─────────────────────────────────────────┐
│  GoodJob API                            │
│                          [Authorize 🔓] │
└─────────────────────────────────────────┘
```

### Paso 2: Modal de Autorización

```
┌──────────────────────────────────────────┐
│  Available authorizations                │
│                                          │
│  bearerAuth (http, bearer)               │
│  ┌──────────────────────────────────┐   │
│  │ Value: [Pega tu token aquí]     │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Ingresa tu token JWT obtenido del login│
│                                          │
│  [Authorize]  [Close]                    │
└──────────────────────────────────────────┘
```

### Paso 3: Autorizado ✅

```
┌─────────────────────────────────────────┐
│  GoodJob API                            │
│                          [Authorize 🔒] │ ← Candado cerrado
└─────────────────────────────────────────┘
```

## 🧪 Ejemplo de Flujo Completo

### 1. Registrarse

**Request:**

```
POST /api/auth/register
{
  "name": "TestUser",
  "password": "test123"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "TestUser"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsIm5hbWUiOiJUZXN0VXNlciIsImlhdCI6MTczMDA0MDAwMCwiZXhwIjoxNzMwNjQ0ODAwfQ.abc123xyz"
}
```

### 2. Copiar Token

Copia solo el token (sin comillas):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsIm5hbWUiOiJUZXN0VXNlciIsImlhdCI6MTczMDA0MDAwMCwiZXhwIjoxNzMwNjQ0ODAwfQ.abc123xyz
```

### 3. Autorizar

Click en **Authorize**, pega el token, click en **Authorize** y **Close**.

### 4. Usar Endpoint Protegido

Ahora puedes usar `POST /api/goodjobs/transfer` directamente desde la interfaz:

**Request:**

```
POST /api/goodjobs/transfer
{
  "goodJobId": 1,
  "fromUserId": 1,
  "toUserId": 2
}
```

El token se incluye automáticamente en el header. ✅

## 🔍 Verificar Autenticación

En cada endpoint, verás un **candado 🔒** que indica si requiere autenticación:

- 🔒 = Endpoint protegido (requiere token)
- 🔓 = Endpoint público (no requiere token)

Después de autorizar, los candados cerrados tendrán un color diferente indicando que tienes autorización.

## ❌ Solución de Problemas

### Error: "Authentication required"

**Causa:** No has autorizado o tu token expiró.

**Solución:**

1. Verifica que el candado en la parte superior esté cerrado 🔒
2. Si está abierto 🔓, haz login y autoriza nuevamente
3. Los tokens expiran después de 7 días

### Error: "You can only transfer GoodJobs that you own"

**Causa:** Estás intentando transferir un GoodJob que no te pertenece.

**Solución:**

- Verifica que el `fromUserId` en la petición coincida con tu ID de usuario
- Solo puedes transferir tus propios GoodJobs

### Token No se Aplica

**Causa:** Olvidaste hacer click en "Authorize" después de pegar el token.

**Solución:**

1. Click en **Authorize**
2. Pega el token
3. Click en **Authorize** (botón verde)
4. Click en **Close**

## 💡 Tips

✅ **Guarda tu token**: Copia el token a un lugar seguro (bloc de notas) mientras lo usas

✅ **Token expira en 7 días**: Después debes hacer login nuevamente

✅ **Un token por sesión**: No necesitas autorizar en cada request, solo una vez

✅ **Cambiar de usuario**: Haz "Logout" y autoriza con otro token

## 🎨 Ventajas de Esta Configuración

1. ✅ **Una vez y listo**: Autorizas una sola vez, no en cada request
2. ✅ **Visual**: El candado muestra claramente qué endpoints requieren auth
3. ✅ **Conveniente**: No necesitas copiar/pegar el header manualmente
4. ✅ **Documentado**: Aparece en la documentación automática
5. ✅ **Compatible**: Funciona con cualquier cliente OpenAPI/Swagger

## 🔗 Recursos Adicionales

- [AUTH_GUIDE.md](./AUTH_GUIDE.md) - Guía completa de autenticación
- [OpenAPI Specification](https://swagger.io/specification/)

---

¡Ahora puedes usar la interfaz de OpenAPI con autenticación JWT de forma fácil y conveniente! 🎉
