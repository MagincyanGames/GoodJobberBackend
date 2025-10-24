# Sistema ORM con Drizzle

Este proyecto ahora utiliza **Drizzle ORM** para manejar la base de datos D1 de Cloudflare de forma automática, similar a como funciona JPA/Hibernate en Spring Boot.

## 🎯 Características

- ✅ **Sin SQL manual**: Define entidades en TypeScript y Drizzle se encarga del resto
- ✅ **Type-safe**: Todas las consultas están tipadas
- ✅ **Migraciones automáticas**: Genera migraciones automáticamente desde tus esquemas
- ✅ **Relaciones**: Maneja relaciones entre entidades automáticamente
- ✅ **Queries builder**: Constructor de consultas intuitivo

## 📁 Estructura

```
src/
  db/
    schema.ts       # Definición de tablas y relaciones (como @Entity en Spring)
    client.ts       # Cliente de base de datos
  repositories/     # Repositorios con métodos CRUD
    UserRepository.ts
    GoodJobRepository.ts
```

## 🚀 Comandos

### Generar migraciones automáticamente

```bash
npm run db:generate
```

### Aplicar migraciones (desarrollo local)

```bash
npm run db:migrate
```

### Aplicar migraciones (producción)

```bash
npm run db:migrate:prod
```

### Ver la base de datos (GUI)

```bash
npm run db:studio
```

## 📝 Cómo usar

### 1. Definir una nueva entidad

Edita `src/db/schema.ts`:

```typescript
export const myTable = sqliteTable("my_table", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

### 2. Generar migración automáticamente

```bash
npm run db:generate
```

### 3. Aplicar migración

```bash
npm run db:migrate
```

### 4. Usar en tu repositorio

```typescript
export class MyRepository {
  constructor(private db: DbClient) {}

  async create(data: { name: string }) {
    const result = await this.db.insert(myTable).values(data).returning();
    return result[0];
  }

  async getById(id: number) {
    return await this.db.query.myTable.findFirst({
      where: eq(myTable.id, id),
    });
  }
}
```

### 5. Acceder al DB en controladores

```typescript
export class MyController extends OpenAPIRoute {
  async handle(c: AppContext) {
    const db = c.get("db"); // Cliente de DB ya inyectado
    const repo = new UserRepository(db);
    const user = await repo.getById(1);
    return user;
  }
}
```

## 🔗 Relaciones

Las relaciones se definen automáticamente y se pueden cargar con `with`:

```typescript
// Cargar un GoodJob con todas sus transferencias y usuarios
const goodJob = await db.query.goodJobs.findFirst({
  where: eq(goodJobs.id, 1),
  with: {
    transfers: {
      with: {
        fromUser: true,
        toUser: true,
      },
    },
  },
});
```

## 📚 Comparación con Spring Boot

| Spring Boot (JPA)         | Drizzle ORM                  |
| ------------------------- | ---------------------------- |
| `@Entity`                 | `sqliteTable()`              |
| `@Id`                     | `.primaryKey()`              |
| `@Column`                 | `.text()`, `.integer()`      |
| `@OneToMany`              | `relations()` con `many()`   |
| `@ManyToOne`              | `relations()` con `one()`    |
| `entityManager.persist()` | `db.insert().values()`       |
| `repository.findById()`   | `db.query.table.findFirst()` |

## 🎓 Más información

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
