import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { AppContext } from "../../types";
import { UserRepository } from "../../repositories/UserRepository";
import { AuthService } from "../../services/AuthService";

export class AuthRegister extends OpenAPIRoute {
  schema = {
    tags: ["Auth"],
    summary: "Register a new user (First user becomes admin)",
    security: [],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: Str({ example: "John Doe" }),
              password: Str({ example: "mySecurePassword123" }),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description:
          "User registered successfully. The first user to register will automatically become an administrator.",
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
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const db = c.get("db");

    const authService = new AuthService(c.env.JWT_SECRET);

    // Hash de la contraseña
    const hash = await authService.hashPassword(data.body.password);

    const userRepo = new UserRepository(db);

    // Verificar si ya existe algún usuario en el sistema
    const existingUsers = await userRepo.getAll();
    const isFirstUser = existingUsers.length === 0;

    // Crear usuario
    // El primer usuario registrado será automáticamente administrador
    const user = await userRepo.create({
      name: data.body.name,
      hash,
      isAdmin: isFirstUser, // El primer usuario es admin, los demás no
    });

    // Generar token JWT
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
