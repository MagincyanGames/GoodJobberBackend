# 📖 Ejemplos Prácticos de Drizzle ORM

Este documento contiene ejemplos prácticos para las operaciones más comunes con Drizzle ORM.

## 📝 Operaciones CRUD Básicas

### Crear (Insert)

```typescript
// Usuario simple
const user = await db
  .insert(users)
  .values({
    name: "Juan Pérez",
    hash: "hashed_password_123",
  })
  .returning();

// Múltiples usuarios
const newUsers = await db
  .insert(users)
  .values([
    { name: "Ana", hash: "hash1" },
    { name: "Luis", hash: "hash2" },
  ])
  .returning();
```

### Leer (Select)

```typescript
// Buscar por ID
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
});

// Buscar por nombre
const user = await db.query.users.findFirst({
  where: eq(users.name, "Juan"),
});

// Listar todos
const allUsers = await db.query.users.findMany();

// Con límite y orden
const recentUsers = await db.query.users.findMany({
  limit: 10,
  orderBy: desc(users.id),
});
```

### Actualizar (Update)

```typescript
// Actualizar un usuario
const updated = await db
  .update(users)
  .set({ name: "Juan Carlos" })
  .where(eq(users.id, 1))
  .returning();

// Actualizar múltiples campos
const updated = await db
  .update(users)
  .set({
    name: "Nuevo Nombre",
    hash: "nuevo_hash",
  })
  .where(eq(users.id, 1))
  .returning();
```

### Eliminar (Delete)

```typescript
// Eliminar por ID
await db.delete(users).where(eq(users.id, 1));

// Eliminar con condición
await db.delete(users).where(eq(users.name, "Usuario Temporal"));
```

## 🔗 Trabajando con Relaciones

### Cargar Relaciones (Eager Loading)

```typescript
// Cargar un GoodJob con todas sus transferencias
const goodJob = await db.query.goodJobs.findFirst({
  where: eq(goodJobs.id, 1),
  with: {
    transfers: true, // Carga todas las transferencias
  },
});

// Cargar con relaciones anidadas
const goodJob = await db.query.goodJobs.findFirst({
  where: eq(goodJobs.id, 1),
  with: {
    transfers: {
      with: {
        fromUser: true, // Usuario emisor
        toUser: true, // Usuario receptor
      },
      orderBy: desc(transfers.date), // Ordenar por fecha
    },
  },
});

// Acceder a los datos
goodJob.transfers.forEach((transfer) => {
  console.log(
    `Transfer de ${transfer.fromUser.name} a ${transfer.toUser.name}`
  );
});
```

### Crear con Relaciones

```typescript
// 1. Crear usuarios
const user1 = await db
  .insert(users)
  .values({
    name: "Alice",
    hash: "hash1",
  })
  .returning();

const user2 = await db
  .insert(users)
  .values({
    name: "Bob",
    hash: "hash2",
  })
  .returning();

// 2. Crear GoodJob
const goodJob = await db
  .insert(goodJobs)
  .values({
    generatedDate: new Date(),
  })
  .returning();

// 3. Crear transferencia
const transfer = await db
  .insert(transfers)
  .values({
    goodJobId: goodJob[0].id,
    fromUserId: user1[0].id,
    toUserId: user2[0].id,
    date: new Date(),
  })
  .returning();
```

## 🔍 Consultas Avanzadas

### Filtros Múltiples

```typescript
import { eq, and, or, gt, lt, like } from "drizzle-orm";

// AND - Todos los criterios deben cumplirse
const results = await db.query.users.findMany({
  where: and(eq(users.name, "Juan"), gt(users.id, 10)),
});

// OR - Al menos un criterio debe cumplirse
const results = await db.query.users.findMany({
  where: or(eq(users.name, "Juan"), eq(users.name, "Pedro")),
});

// LIKE - Búsqueda parcial
const results = await db.select().from(users).where(like(users.name, "%Juan%"));
```

### Ordenamiento

```typescript
import { asc, desc } from "drizzle-orm";

// Orden ascendente
const users = await db.query.users.findMany({
  orderBy: asc(users.name),
});

// Orden descendente
const users = await db.query.users.findMany({
  orderBy: desc(users.id),
});

// Múltiples criterios
const users = await db
  .select()
  .from(users)
  .orderBy(asc(users.name), desc(users.id));
```

### Paginación

```typescript
// Página 1 (primeros 10)
const page1 = await db.query.users.findMany({
  limit: 10,
  offset: 0,
});

// Página 2 (siguientes 10)
const page2 = await db.query.users.findMany({
  limit: 10,
  offset: 10,
});

// Función de paginación reutilizable
async function getPaginatedUsers(page: number, pageSize: number = 10) {
  return await db.query.users.findMany({
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
}
```

### Conteo

```typescript
import { count } from "drizzle-orm";

// Contar todos los usuarios
const result = await db.select({ count: count() }).from(users);
const totalUsers = result[0].count;

// Contar con filtro
const result = await db
  .select({ count: count() })
  .from(users)
  .where(like(users.name, "%Juan%"));
```

## 🔄 Transacciones

```typescript
// Transacción simple
await db.transaction(async (tx) => {
  // Crear usuario
  const user = await tx
    .insert(users)
    .values({
      name: "Carlos",
      hash: "hash",
    })
    .returning();

  // Crear GoodJob para ese usuario
  await tx.insert(goodJobs).values({
    generatedDate: new Date(),
  });

  // Si hay algún error aquí, todo se revierte (rollback)
});

// Transacción con manejo de errores
try {
  await db.transaction(async (tx) => {
    const user = await tx
      .insert(users)
      .values({
        name: "Duplicate",
        hash: "hash",
      })
      .returning();

    // Operación que podría fallar
    await tx.insert(users).values({
      name: user[0].name, // Duplicate!
      hash: "hash2",
    });
  });
} catch (error) {
  console.error("Transaction failed:", error);
  // Todo se ha revertido automáticamente
}
```

## 📊 Joins Manuales (Avanzado)

```typescript
// Join manual (cuando necesitas más control)
const results = await db
  .select({
    goodJobId: goodJobs.id,
    transferId: transfers.id,
    userName: users.name,
  })
  .from(goodJobs)
  .leftJoin(transfers, eq(transfers.goodJobId, goodJobs.id))
  .leftJoin(users, eq(users.id, transfers.toUserId));
```

## 🎯 Ejemplo Completo: Repository Pattern

```typescript
import { eq, desc } from "drizzle-orm";
import { DbClient } from "../db/client";
import { goodJobs, transfers } from "../db/schema";

export class GoodJobService {
  constructor(private db: DbClient) {}

  // Crear un GoodJob y su primera transferencia en una transacción
  async createWithTransfer(data: { fromUserId: number; toUserId: number }) {
    return await this.db.transaction(async (tx) => {
      // 1. Crear GoodJob
      const goodJob = await tx
        .insert(goodJobs)
        .values({
          generatedDate: new Date(),
        })
        .returning();

      // 2. Crear transferencia inicial
      const transfer = await tx
        .insert(transfers)
        .values({
          goodJobId: goodJob[0].id,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          date: new Date(),
        })
        .returning();

      return { goodJob: goodJob[0], transfer: transfer[0] };
    });
  }

  // Obtener un GoodJob con su historial completo
  async getWithHistory(id: number) {
    return await this.db.query.goodJobs.findFirst({
      where: eq(goodJobs.id, id),
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
  }

  // Transferir un GoodJob a otro usuario
  async transfer(goodJobId: number, fromUserId: number, toUserId: number) {
    const transfer = await this.db
      .insert(transfers)
      .values({
        goodJobId,
        fromUserId,
        toUserId,
        date: new Date(),
      })
      .returning();

    return transfer[0];
  }

  // Obtener el último poseedor de un GoodJob
  async getCurrentOwner(goodJobId: number) {
    const lastTransfer = await this.db.query.transfers.findFirst({
      where: eq(transfers.goodJobId, goodJobId),
      with: {
        toUser: true,
      },
      orderBy: desc(transfers.date),
    });

    return lastTransfer?.toUser;
  }
}
```

## 🧪 Testing

```typescript
// Ejemplo de test con datos de prueba
async function testDatabase(db: DbClient) {
  // 1. Crear usuarios de prueba
  const users = await db
    .insert(users)
    .values([
      { name: "Test User 1", hash: "hash1" },
      { name: "Test User 2", hash: "hash2" },
    ])
    .returning();

  // 2. Crear GoodJob
  const goodJob = await db
    .insert(goodJobs)
    .values({
      generatedDate: new Date(),
    })
    .returning();

  // 3. Crear transferencia
  await db.insert(transfers).values({
    goodJobId: goodJob[0].id,
    fromUserId: users[0].id,
    toUserId: users[1].id,
    date: new Date(),
  });

  // 4. Verificar
  const result = await db.query.goodJobs.findFirst({
    where: eq(goodJobs.id, goodJob[0].id),
    with: { transfers: { with: { fromUser: true, toUser: true } } },
  });

  console.log("Test passed!", result);
}
```

## 💡 Tips y Mejores Prácticas

### 1. Siempre usar `.returning()` después de INSERT/UPDATE

```typescript
// ✅ Bueno - devuelve el registro insertado
const user = await db.insert(users).values({...}).returning();

// ❌ Malo - no sabes qué ID se generó
await db.insert(users).values({...});
```

### 2. Usar transacciones para operaciones múltiples

```typescript
// ✅ Bueno - todo se revierte si algo falla
await db.transaction(async (tx) => {
  await tx.insert(users).values({...});
  await tx.insert(goodJobs).values({...});
});
```

### 3. Validar existencia antes de operaciones

```typescript
// ✅ Bueno - verifica antes de operar
const user = await db.query.users.findFirst({ where: eq(users.id, id) });
if (!user) throw new NotFoundException();
await db.update(users).set({...}).where(eq(users.id, id));
```

### 4. Usar relaciones en lugar de joins manuales

```typescript
// ✅ Bueno - más legible y type-safe
const goodJob = await db.query.goodJobs.findFirst({
  with: { transfers: { with: { toUser: true } } },
});

// ⚠️ Evitar (a menos que sea necesario)
const results = await db.select()
  .from(goodJobs)
  .leftJoin(transfers, eq(...));
```

---

Para más información, consulta:

- [DRIZZLE_GUIDE.md](./DRIZZLE_GUIDE.md)
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
- [Drizzle Documentation](https://orm.drizzle.team/)
