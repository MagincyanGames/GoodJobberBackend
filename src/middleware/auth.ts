import { Context, Next } from "hono";
import { AuthService } from "../services/AuthService";
import type { Env } from "../types";
import type { DbClient } from "../db/client";

type Variables = {
  db: DbClient;
  user?: any;
};

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const authService = new AuthService(c.env.JWT_SECRET);

    const payload = await authService.verifyToken(token);
    if (payload) {
      c.set("user", payload);
    }
  }

  await next();
}

export function requireAuth(
  c: Context<{ Bindings: Env; Variables: Variables }>
): boolean {
  const user = c.get("user");
  if (!user) {
    c.status(401);
    return false;
  }
  return true;
}

// nuevo: helper que comprueba rol/flag de admin
export function requireAdmin(
  c: Context<{ Bindings: Env; Variables: Variables }>
): boolean {
  const user = c.get("user");
  if (!user) {
    c.status(401);
    return false;
  }

  // ajusta según la forma en que guardas el rol en el payload
  const isAdmin =
    user.isAdmin === true ||
    user.role === "admin" ||
    (Array.isArray(user.roles) && user.roles.includes("admin"));

  if (!isAdmin) {
    c.status(403);
    return false;
  }

  return true;
}

// nuevo: middleware que bloquea si no es admin (puede usarse en la cadena de la ruta)
export async function adminMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  if (!requireAdmin(c)) {
    // opcional: devolver body JSON
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
}
