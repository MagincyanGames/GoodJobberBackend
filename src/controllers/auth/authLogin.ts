import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { AppContext } from "../../types";
import { UserRepository } from "../../repositories/UserRepository";
import { AuthService } from "../../services/AuthService";

export class AuthLogin extends OpenAPIRoute {
  schema = {
    tags: ["Auth"],
    summary: "Login with credentials",
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
        description: "Login successful",
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
        description: "Invalid credentials",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const db = c.get("db");

    const authService = new AuthService(c.env.JWT_SECRET);
    const userRepo = new UserRepository(db);

    try {
      // Buscar usuario por nombre
      const user = await userRepo.getByName(data.body.name);

      // Verificar contraseña
      const isValid = await authService.verifyPassword(
        data.body.password,
        user.hash
      );

      if (!isValid) {
        return c.json(
          {
            success: false,
            message: "Invalid credentials",
          },
          401
        );
      }

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
    } catch (error) {
      return c.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        401
      );
    }
  }
}
