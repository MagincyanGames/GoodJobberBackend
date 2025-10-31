import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { AppContext } from "../../types";
import { UserRepository } from "../../repositories/UserRepository";
import { GoodJobRepository } from "../../repositories/GoodJobRepository";

export class AuthMe extends OpenAPIRoute {
  schema = {
    tags: ["Auth"],
    summary: "Get current user information with their GoodJobs",
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        includeGoodJobs: z.boolean().optional(),
        includeTransactions: z.boolean().optional(),
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
                isAdmin: z.boolean(),
              }),
              goodJobsCount: z.number(),
              goodJobs: z.array(z.any()).optional(),
              transactions: z
                .object({
                  sent: z.array(z.any()).optional(),
                  received: z.array(z.any()).optional(),
                })
                .optional(),
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
        isAdmin: userInfo.isAdmin,
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

    // Si se solicita, incluir las transacciones
    if (data.query?.includeTransactions) {
      const transfersSent = await userRepo.getTransfersSent(user.userId);
      const transfersReceived = await userRepo.getTransfersReceived(
        user.userId
      );

      response.transactions = {
        sent: transfersSent.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          toUser: {
            id: t.toUser.id,
            name: t.toUser.name,
          },
          goodJobId: t.goodJobId,
          balanceAfter: t.balanceAfterFrom,
        })),
        received: transfersReceived.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          fromUser: {
            id: t.fromUser.id,
            name: t.fromUser.name,
          },
          goodJobId: t.goodJobId,
          balanceAfter: t.balanceAfterTo,
        })),
      };
    }

    return response;
  }
}
