import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { UserRepository } from "../repositories/UserRepository";
import { GoodJobRepository } from "../repositories/GoodJobRepository";

export class UserMe extends OpenAPIRoute {
  schema = {
    tags: ["Auth"],
    summary: "Get current user information with their GoodJobs",
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        includeGoodJobs: z.boolean().optional(),
      }),
    },
    responses: {
      "200": {
        description: "Current user information",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              user: z.object({
                id: z.number(),
                name: z.string(),
              }),
              goodJobsCount: z.number(),
              goodJobs: z.array(z.any()).optional(),
            }),
          },
        },
      },
      "401": {
        description: "Not authenticated",
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const db = c.get("db");
    const user = c.get("user");

    // Verificar autenticación
    if (!user) {
      return c.json(
        {
          success: false,
          message: "Authentication required",
        },
        401
      );
    }

    const userRepo = new UserRepository(db);
    const goodJobRepo = new GoodJobRepository(db);

    // Obtener información del usuario
    const userInfo = await userRepo.getById(user.userId);

    // Contar GoodJobs del usuario
    const goodJobsCount = await goodJobRepo.countByOwner(user.userId);

    // Preparar respuesta
    const response: any = {
      success: true,
      user: {
        id: userInfo.id,
        name: userInfo.name,
      },
      goodJobsCount,
    };

    // Si se solicita, incluir la lista de GoodJobs
    if (data.query?.includeGoodJobs) {
      const goodJobs = await goodJobRepo.getByOwner(user.userId);
      response.goodJobs = goodJobs.map((gj) => ({
        id: gj.id,
        generatedDate: gj.generatedDate.toISOString(),
        currentOwner: gj.currentOwner
          ? {
              id: gj.currentOwner.id,
              name: gj.currentOwner.name,
            }
          : null,
        lastTransferDate: gj.lastTransferDate?.toISOString() || null,
      }));
    }

    return response;
  }
}
