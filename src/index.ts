import { fromHono } from "chanfana";
import { Hono } from "hono";
import { UserCreate } from "./controllers/user/userCreate";
import { UserList } from "./controllers/user/userList";
import { AuthRegister } from "./controllers/auth/authRegister";
import { AuthLogin } from "./controllers/auth/authLogin";
import { AuthMe } from "./controllers/auth/authMe";
import { AuthVerify } from "./controllers/auth/authVerify";
import { GoodJobCreate } from "./controllers/goodJobCreate";
import { GoodJobTransfer } from "./controllers/goodJobTransfer";
import { GoodJobFetch } from "./controllers/goodJobFetch";
import { GoodJobsByOwner } from "./controllers/goodJobsByOwner";
import { GoodJobCountByOwner } from "./controllers/goodJobCountByOwner";
import { createDbClient, DbClient } from "./db/client";
import { adminMiddleware, authMiddleware } from "./middleware/auth";
import type { JWTPayload } from "./services/AuthService";

// Definir el tipo de variables para Hono
type Variables = {
  db: DbClient;
  user?: JWTPayload;
};

// Start a Hono app
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware para inyectar el cliente de DB en el contexto
app.use("*", async (c, next) => {
  const db = createDbClient(c.env.good_job_db);
  c.set("db", db);
  await next();
});

// Middleware de autenticación (verifica JWT si está presente)
app.use("*", authMiddleware);

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
  schema: {
    info: {
      title: "GoodJob API",
      version: "1.0.0",
      description: "API para gestionar GoodJobs con autenticación JWT",
    },
  },
});

// Registrar el esquema de seguridad Bearer Auth manualmente
openapi.registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Ingresa tu token JWT obtenido del login",
});

// Auth endpoints (no requieren autenticación)
openapi.post("/api/auth/register", AuthRegister);
openapi.post("/api/auth/login", AuthLogin);

// Protected auth endpoints (requieren autenticación)
openapi.get("/api/auth/me", AuthMe);
openapi.get("/api/auth/verify", AuthVerify);

// Public endpoints (no requieren autenticación)
openapi.get("/api/users", UserList);
openapi.get("/api/goodjobs/:id", GoodJobFetch);
openapi.get("/api/users/:userId/goodjobs", GoodJobsByOwner);
openapi.get("/api/users/:userId/goodjobs/count", GoodJobCountByOwner);

// Protected endpoints (requieren autenticación)

app.use("/api/goodjobs", adminMiddleware);
openapi.post("/api/goodjobs", GoodJobCreate);

app.use("/api/goodjobs/transfer", authMiddleware);
openapi.post("/api/goodjobs/transfer", GoodJobTransfer);

// Admin endpoints (requieren autenticación y rol admin)
openapi.post("/api/users", UserCreate);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
