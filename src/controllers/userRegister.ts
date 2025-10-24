import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { UserRepository } from "../repositories/UserRepository";
import { AuthService } from "../services/AuthService";

export class UserRegister extends OpenAPIRoute {
  schema = {
    tags: ["Auth"],
    summary: "Register a new user",
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
        description: "User registered successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              user: z.object({
                id: z.number(),
                name: z.string(),
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

    // Crear usuario
    const userRepo = new UserRepository(db);
    const user = await userRepo.create({
      name: data.body.name,
      hash,
    });

    // Generar token JWT
    const token = await authService.generateToken(user.id, user.name);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
      },
      token,
    };
  }
}
