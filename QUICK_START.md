# 🚀 Quick Start - Empezar a usar Drizzle ORM

## ▶️ Pasos Inmediatos

### 1. Iniciar el servidor de desarrollo

```bash
npm run dev
```

El servidor se iniciará en: **http://localhost:8787**

### 2. Probar los endpoints

Abre tu navegador en http://localhost:8787 y verás la documentación OpenAPI automática.

#### Crear un usuario

```bash
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Juan Pérez", "hash": "password123"}'
```

#### Listar usuarios

```bash
curl http://localhost:8787/api/users
```

#### Crear un GoodJob

```bash
curl -X POST http://localhost:8787/api/goodjobs \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🎯 Tu Primera Entidad

### Paso 1: Definir la tabla en `src/db/schema.ts`

```typescript
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  price: integer("price").notNull(), // En centavos
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

### Paso 2: Generar migración

```bash
npm run db:generate
```

### Paso 3: Aplicar migración

```bash
npm run db:migrate
```

### Paso 4: Crear repositorio `src/repositories/ProductRepository.ts`

```typescript
import { eq } from "drizzle-orm";
import { DbClient } from "../db/client";
import { products } from "../db/schema";
import { NotFoundException } from "chanfana";

export class ProductRepository {
  constructor(private db: DbClient) {}

  async create(data: { name: string; price: number }) {
    const result = await this.db
      .insert(products)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async getById(id: number) {
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async getAll() {
    return await this.db.query.products.findMany();
  }
}
```

### Paso 5: Crear controlador `src/controllers/productCreate.ts`

```typescript
import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { ProductRepository } from "../repositories/ProductRepository";

export class ProductCreate extends OpenAPIRoute {
  schema = {
    tags: ["Products"],
    summary: "Create a new product",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: Str(),
              price: z.number(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Product created",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              product: z.any(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const db = c.get("db");

    const repo = new ProductRepository(db);
    const product = await repo.create(data.body);

    return { success: true, product };
  }
}
```

### Paso 6: Registrar ruta en `src/index.ts`

```typescript
import { ProductCreate } from "./controllers/productCreate";

// ... código existente ...

openapi.post("/api/products", ProductCreate);
```

### Paso 7: ¡Listo! Reinicia el servidor

```bash
# Ctrl+C para detener
npm run dev
```

## 📚 Documentos de Ayuda

- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Resumen completo de la migración
- **[DRIZZLE_GUIDE.md](./DRIZZLE_GUIDE.md)** - Guía de uso de Drizzle
- **[EXAMPLES.md](./EXAMPLES.md)** - Ejemplos prácticos de código

## 🆘 Solución de Problemas

### Error: "table not found"

Aplica las migraciones:

```bash
npm run db:migrate
```

### Los cambios no se reflejan

Regenera migraciones después de cambiar el schema:

```bash
npm run db:generate
npm run db:migrate
```

### Ver el contenido de la base de datos

```bash
npm run db:studio
```

Abrirá una interfaz web para ver tus datos.

## 🎓 Conceptos Clave

1. **Schema** (`src/db/schema.ts`): Define tus tablas y relaciones
2. **Migrations**: Se generan automáticamente con `npm run db:generate`
3. **Repository**: Encapsula operaciones de base de datos
4. **Controller**: Maneja HTTP y usa repositorios
5. **DB Client**: Ya está inyectado en `c.get('db')`

## 🔥 Próximos Pasos

1. ✅ Ejecuta `npm run dev`
2. ✅ Prueba los endpoints en http://localhost:8787
3. ✅ Crea tu primera entidad siguiendo los pasos arriba
4. ✅ Lee los ejemplos en [EXAMPLES.md](./EXAMPLES.md)

---

**¿Dudas?** Consulta los archivos de documentación o la [documentación oficial de Drizzle](https://orm.drizzle.team/)
