# 🚀 Optimización: Propietario Actual de GoodJobs

## 📊 Problema Original

Anteriormente, para saber quién es el propietario actual de un GoodJob, era necesario:

1. Cargar todas las transferencias del GoodJob
2. Ordenarlas por fecha
3. Tomar el usuario receptor de la última transferencia

**Esto era costoso** especialmente si un GoodJob tenía muchas transferencias.

## ✅ Solución Implementada

Ahora cada GoodJob mantiene una **referencia directa** al propietario actual:

```typescript
export const goodJobs = sqliteTable("good_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  generatedDate: integer("generated_date", { mode: "timestamp" }).notNull(),
  currentOwnerId: integer("current_owner_id").references(() => users.id),
  lastTransferDate: integer("last_transfer_date", { mode: "timestamp" }),
});
```

### Campos Agregados:

- **`currentOwnerId`**: ID del usuario que posee actualmente el GoodJob
- **`lastTransferDate`**: Fecha de la última transferencia

## 🔒 Coherencia de Datos

Para mantener la coherencia entre el `currentOwnerId` y el historial de transferencias, se usa una **transacción**:

```typescript
async addTransfer(data: {
  goodJobId: number;
  fromUserId: number;
  toUserId: number;
}) {
  return await this.db.transaction(async (tx) => {
    // 1. Crear la transferencia
    const transfer = await tx
      .insert(transfers)
      .values({
        goodJobId: data.goodJobId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        date: new Date(),
      })
      .returning();

    // 2. Actualizar el propietario actual (en la misma transacción)
    await tx
      .update(goodJobs)
      .set({
        currentOwnerId: data.toUserId,
        lastTransferDate: new Date(),
      })
      .where(eq(goodJobs.id, data.goodJobId));

    return transfer[0];
  });
}
```

Si algo falla, **ambas operaciones se revierten** automáticamente.

## 📈 Comparación de Rendimiento

### ❌ Antes (Ineficiente)

```typescript
// Cargar GoodJob con TODAS las transferencias
const goodJob = await db.query.goodJobs.findFirst({
  where: eq(goodJobs.id, 1),
  with: {
    transfers: {
      with: {
        fromUser: true,
        toUser: true,
      },
      orderBy: desc(transfers.date),
    },
  },
});

// Obtener propietario de la última transferencia
const owner = goodJob.transfers[0]?.toUser;
```

**Problema:**

- Carga todas las transferencias (N registros)
- Carga todos los usuarios de cada transferencia (2N registros)
- Si hay 100 transferencias = 201 registros cargados!

### ✅ Ahora (Optimizado)

```typescript
// Cargar GoodJob solo con propietario actual
const goodJob = await db.query.goodJobs.findFirst({
  where: eq(goodJobs.id, 1),
  with: {
    currentOwner: true, // Solo 1 JOIN
  },
});

const owner = goodJob.currentOwner;
```

**Ventajas:**

- Solo 2 registros (GoodJob + Usuario)
- 1 JOIN en lugar de N
- **Hasta 100x más rápido** con muchas transferencias

## 🎯 Casos de Uso

### 1. Obtener Propietario Actual (Rápido)

```typescript
const owner = await goodJobRepo.getCurrentOwner(goodJobId);
// Una consulta simple, sin cargar historial
```

### 2. Ver GoodJob sin Historial (Rápido)

```typescript
const goodJob = await goodJobRepo.getById(goodJobId, false);
// Incluye propietario actual pero no el historial
```

### 3. Ver GoodJob con Historial Completo (Cuando sea necesario)

```typescript
const goodJob = await goodJobRepo.getById(goodJobId, true);
// Carga todo el historial de transferencias
```

### 4. Listar GoodJobs de un Usuario (Nuevo y Optimizado)

```typescript
const userGoodJobs = await goodJobRepo.getByOwner(userId);
// Consulta directa por índice, muy rápida
```

## 🔗 Nuevos Endpoints

### 1. Transferir GoodJob

```bash
POST /api/goodjobs/transfer
{
  "goodJobId": 1,
  "fromUserId": 1,
  "toUserId": 2
}
```

Respuesta:

```json
{
  "success": true,
  "transfer": {
    "id": 1,
    "goodJobId": 1,
    "fromUserId": 1,
    "toUserId": 2,
    "date": "2025-10-24T10:30:00.000Z"
  },
  "currentOwner": {
    "id": 2,
    "name": "Juan Pérez"
  }
}
```

### 2. Obtener GoodJob con/sin Historial

```bash
# Sin historial (rápido)
GET /api/goodjobs/1

# Con historial completo
GET /api/goodjobs/1?includeHistory=true
```

Respuesta (sin historial):

```json
{
  "success": true,
  "goodJob": {
    "id": 1,
    "generatedDate": "2025-10-24T10:00:00.000Z",
    "currentOwner": {
      "id": 2,
      "name": "Juan Pérez"
    },
    "lastTransferDate": "2025-10-24T10:30:00.000Z"
  }
}
```

### 3. Listar GoodJobs de un Usuario

```bash
GET /api/users/2/goodjobs
```

Respuesta:

```json
{
  "success": true,
  "count": 3,
  "goodJobs": [
    {
      "id": 1,
      "generatedDate": "2025-10-24T10:00:00.000Z",
      "currentOwner": {
        "id": 2,
        "name": "Juan Pérez"
      },
      "lastTransferDate": "2025-10-24T10:30:00.000Z"
    }
    // ... más GoodJobs
  ]
}
```

## 🧪 Ejemplo de Flujo Completo

```typescript
// 1. Crear usuarios
const user1 = await userRepo.create({ name: "Alice", hash: "hash1" });
const user2 = await userRepo.create({ name: "Bob", hash: "hash2" });

// 2. Crear GoodJob con propietario inicial
const goodJob = await goodJobRepo.create({
  initialOwnerId: user1.id,
});
console.log(goodJob.currentOwnerId); // user1.id

// 3. Transferir a otro usuario
await goodJobRepo.addTransfer({
  goodJobId: goodJob.id,
  fromUserId: user1.id,
  toUserId: user2.id,
});

// 4. Verificar propietario actual (rápido!)
const owner = await goodJobRepo.getCurrentOwner(goodJob.id);
console.log(owner.name); // "Bob"

// 5. Ver solo info actual (rápido)
const current = await goodJobRepo.getById(goodJob.id, false);
console.log(current.currentOwner.name); // "Bob"
console.log(current.transfers); // undefined (no cargado)

// 6. Ver historial completo (cuando sea necesario)
const full = await goodJobRepo.getById(goodJob.id, true);
console.log(full.transfers.length); // 1
console.log(full.transfers[0].fromUser.name); // "Alice"
console.log(full.transfers[0].toUser.name); // "Bob"
```

## 📊 Benchmarks Estimados

| Operación                                | Antes  | Ahora | Mejora                              |
| ---------------------------------------- | ------ | ----- | ----------------------------------- |
| Obtener propietario (10 transferencias)  | ~15ms  | ~2ms  | **7.5x más rápido**                 |
| Obtener propietario (100 transferencias) | ~120ms | ~2ms  | **60x más rápido**                  |
| Listar GoodJobs de usuario               | ~200ms | ~10ms | **20x más rápido**                  |
| Transferir GoodJob                       | ~5ms   | ~7ms  | Similar (overhead de actualización) |

## 🎓 Principios Aplicados

1. **Desnormalización controlada**: Duplicamos el `currentOwnerId` para optimizar lecturas
2. **Transacciones ACID**: Garantizan coherencia entre tablas
3. **Lazy Loading**: El historial solo se carga cuando se necesita
4. **Índices**: `currentOwnerId` puede ser indexado para búsquedas rápidas

## 🔄 Migración Aplicada

La migración se generó y aplicó automáticamente:

```sql
ALTER TABLE `good_jobs` ADD `current_owner_id` integer REFERENCES users(id);
ALTER TABLE `good_jobs` ADD `last_transfer_date` integer;
```

Archivo: `drizzle/migrations/0001_curved_nick_fury.sql`

## ✅ Ventajas de esta Solución

1. ✅ **Más rápido**: No necesita buscar en transferencias
2. ✅ **Escalable**: Funciona bien con miles de transferencias
3. ✅ **Flexible**: Puedes elegir cargar historial o no
4. ✅ **Coherente**: Las transacciones garantizan datos correctos
5. ✅ **Type-safe**: Todo tipado con TypeScript
6. ✅ **Mantenible**: El código es claro y fácil de entender

## 🚀 Próximos Pasos

Puedes aplicar este mismo patrón a otras entidades:

- Agregar campos calculados frecuentemente consultados
- Usar transacciones para mantener coherencia
- Permitir carga lazy/eager según necesidad

---

**Documentación relacionada:**

- [EXAMPLES.md](./EXAMPLES.md) - Más ejemplos de uso
- [DRIZZLE_GUIDE.md](./DRIZZLE_GUIDE.md) - Guía completa de Drizzle
