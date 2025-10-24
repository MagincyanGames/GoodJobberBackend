import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";

export class TokenVerify extends OpenAPIRoute {
  schema = {
    tags: ["Auth"],
    summary: "Verify JWT token validity",
    security: [{ bearerAuth: [] }],
    responses: {
      "200": {
        description: "Token is valid",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              valid: z.boolean(),
              user: z
                .object({
                  userId: z.number(),
                  name: z.string(),
                  iat: z.number(),
                  exp: z.number(),
                })
                .optional(),
              expiresIn: z.string().optional(),
            }),
          },
        },
      },
      "401": {
        description: "Token is invalid or missing",
      },
    },
  };

  async handle(c: AppContext) {
    const user = c.get("user");

    // Si no hay usuario, el token es inválido o no existe
    if (!user) {
      return c.json(
        {
          success: true,
          valid: false,
          message: "Token is invalid or missing",
        },
        401
      );
    }

    // Calcular tiempo restante hasta expiración
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = user.exp! - now;
    const days = Math.floor(expiresInSeconds / 86400);
    const hours = Math.floor((expiresInSeconds % 86400) / 3600);
    const minutes = Math.floor((expiresInSeconds % 3600) / 60);

    let expiresIn = "";
    if (days > 0) expiresIn += `${days}d `;
    if (hours > 0) expiresIn += `${hours}h `;
    if (minutes > 0) expiresIn += `${minutes}m`;
    expiresIn = expiresIn.trim() || "Less than 1 minute";

    return {
      success: true,
      valid: true,
      user: {
        userId: user.userId,
        name: user.name,
        iat: user.iat!,
        exp: user.exp!,
      },
      expiresIn,
    };
  }
}
