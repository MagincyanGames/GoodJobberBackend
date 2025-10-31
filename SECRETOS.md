# 🔐 Guía de Configuración de Secretos

## 🎯 Resumen

En Cloudflare Workers, los secretos **NO se manejan con archivos `.env`** como en Node.js tradicional. Aquí te explicamos cómo funcionan:

## 📍 Diferentes Ambientes

### 1. Desarrollo Local (`npm run dev`)

Para desarrollo local, Cloudflare Workers usa el archivo **`.dev.vars`**:

```bash
# 1. Copia el archivo de ejemplo
cp .dev.vars.example .dev.vars

# 2. Edita .dev.vars y cambia los valores
# Ejemplo del contenido:
JWT_SECRET=mi-secreto-de-desarrollo-local-12345
```

⚠️ **El archivo `.dev.vars` NO se commitea** (está en `.gitignore`)

### 2. Producción (Cloudflare Workers)

Para producción, los secretos se configuran con el CLI de Wrangler:

```bash
# Configurar JWT_SECRET en producción
npx wrangler secret put JWT_SECRET

# Te pedirá que ingreses el valor (no se mostrará mientras escribes)
# Enter a secret value: ************************************
# ✨ Success! Uploaded secret JWT_SECRET
```

**Ventajas:**

- ✅ El secreto se almacena de forma segura en Cloudflare
- ✅ No aparece en el código ni en los logs
- ✅ Se encripta automáticamente
- ✅ Solo es accesible por tu Worker

## 🛠️ Configuración Paso a Paso

### Para Desarrollo Local

1. **Copia el archivo de ejemplo:**

   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. **Genera un JWT_SECRET seguro:**

   ```bash
   # En PowerShell:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

   # En Linux/Mac:
   openssl rand -base64 32
   ```

3. **Edita `.dev.vars` y pega el secret:**

   ```bash
   JWT_SECRET=tu-secret-generado-aqui
   ```

4. **Inicia el servidor:**
   ```bash
   npm run dev
   ```

### Para Producción

1. **Asegúrate de estar logueado en Cloudflare:**

   ```bash
   npx wrangler login
   ```

2. **Genera un JWT_SECRET seguro** (igual que arriba)

3. **Configura el secreto en Cloudflare:**

   ```bash
   npx wrangler secret put JWT_SECRET
   # Pega tu secret cuando te lo pida
   ```

4. **Despliega tu aplicación:**
   ```bash
   npm run deploy
   ```

## 📋 Lista de Secretos Necesarios

### Obligatorios

| Variable     | Descripción                   | Ejemplo                            |
| ------------ | ----------------------------- | ---------------------------------- |
| `JWT_SECRET` | Secret para firmar tokens JWT | `a8f5f167f44f4964e6c998dee827110c` |

### Opcionales (para scripts)

| Variable         | Descripción                  | Archivo que lo usa      |
| ---------------- | ---------------------------- | ----------------------- |
| `ADMIN_NAME`     | Nombre del admin inicial     | `scripts/seed-admin.ts` |
| `ADMIN_PASSWORD` | Contraseña del admin inicial | `scripts/seed-admin.ts` |

## 🔍 Verificar Secretos Configurados

### En Desarrollo Local

El archivo `.dev.vars` debe existir y tener el formato correcto.

### En Producción

```bash
# Listar secretos configurados (solo muestra los nombres, no los valores)
npx wrangler secret list

# Resultado esperado:
# [
#   {
#     "name": "JWT_SECRET",
#     "type": "secret_text"
#   }
# ]
```

## ⚠️ Errores Comunes

### Error: "JWT_SECRET is not defined"

**Causa:** No has configurado el secreto.

**Solución para desarrollo:**

```bash
cp .dev.vars.example .dev.vars
# Edita .dev.vars y agrega JWT_SECRET
```

**Solución para producción:**

```bash
npx wrangler secret put JWT_SECRET
```

### Error: "Cannot find module '.env'"

**Causa:** Estás intentando cargar `.env` con `dotenv`, pero en Workers no se usa.

**Solución:** Usa `.dev.vars` para desarrollo y `wrangler secret` para producción.

## 📚 Acceder a Secretos en el Código

Los secretos están disponibles en `c.env`:

```typescript
// En cualquier controlador o middleware
const jwtSecret = c.env.JWT_SECRET;

// Ejemplo en AuthService:
export class AuthService {
  constructor(private jwtSecret: string) {}

  async generateToken(userId: number, name: string) {
    return await sign(
      { userId, name },
      this.jwtSecret, // ← Viene de c.env.JWT_SECRET
      "HS256"
    );
  }
}
```

## 🔄 Rotar Secretos

Si necesitas cambiar un secreto (por seguridad):

```bash
# 1. Genera un nuevo secret
openssl rand -base64 32

# 2. Actualiza en producción
npx wrangler secret put JWT_SECRET
# Ingresa el nuevo valor

# 3. Redespliega (opcional, pero recomendado)
npm run deploy
```

⚠️ **Nota:** Los tokens JWT firmados con el secret anterior dejarán de funcionar.

## 📖 Más Información

- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)

## ✅ Checklist de Seguridad

- [ ] Archivo `.dev.vars` existe y NO está commiteado
- [ ] `JWT_SECRET` configurado en producción con `wrangler secret put`
- [ ] `JWT_SECRET` es aleatorio y seguro (mínimo 32 caracteres)
- [ ] Contraseña del admin cambiada (no usar `admin123`)
- [ ] `.gitignore` incluye `.dev.vars` y `.env`
- [ ] `wrangler.jsonc` NO contiene secretos en texto plano

## 🎓 Diferencias con Node.js Tradicional

| Node.js Tradicional     | Cloudflare Workers             |
| ----------------------- | ------------------------------ |
| Archivo `.env`          | Archivo `.dev.vars` (solo dev) |
| `require('dotenv')`     | No necesario                   |
| `process.env.VAR`       | `c.env.VAR` o `env.VAR`        |
| Variables en el sistema | `wrangler secret put`          |
| `.env` commiteado = 😱  | `.dev.vars` en `.gitignore` ✅ |
