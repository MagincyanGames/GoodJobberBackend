import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { AppContext } from "../../types";
import { UserRepository } from "../../repositories/UserRepository";
import { AuthService } from "../../services/AuthService";

export class UserCreate extends OpenAPIRoute {
  schema = {
    tags: ["Users"],
    summary: "Create a new user (Admin only)",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: Str({ example: "John Doe" }),
              password: Str({ example: "mySecurePassword123" }),
              isAdmin: z.boolean().optional().default(false),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "User created successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              user: z.object({
                id: z.number(),
                name: z.string(),
                isAdmin: z.boolean(),
              }),
              token: z.string(),
            }),
          },
        },
      },
      "401": {
        description: "Unauthorized - No token provided",
      },
      "403": {
        description: "Forbidden - Admin access required",
      },
    },
  };

  async handle(c: AppContext) {
    // Verificar que el usuario esté autenticado
    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    // Verificar que el usuario sea admin
    if (!currentUser.isAdmin) {
      return c.json({ success: false, error: "Admin access required" }, 403);
    }

    const data = await this.getValidatedData<typeof this.schema>();
    const db = c.get("db");

    const authService = new AuthService(c.env.JWT_SECRET);

    // Hash de la contraseña
    const hash = await authService.hashPassword(data.body.password);

    // Crear usuario
    const userRepo = new UserRepository(db);
    const user = await userRepo.create({
      name: data.body.name,
      hash,
      isAdmin: data.body.isAdmin ?? false,
    });

    // Generar token JWT para el nuevo usuario
    const token = await authService.generateToken(
      user.id,
      user.name,
      user.isAdmin
    );

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      token,
    };
  }
}
