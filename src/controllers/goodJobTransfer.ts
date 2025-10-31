import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { GoodJobRepository } from "../repositories/GoodJobRepository";
import { UserRepository } from "../repositories/UserRepository";

export class GoodJobTransfer extends OpenAPIRoute {
  schema = {
    tags: ["GoodJobs"],
    summary: "Transfer a GoodJob to another user (requires authentication)",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              goodJobId: z.number().int().positive().optional(),
              toUserId: z.number().int().positive(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "GoodJob transferred successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              transfer: z.object({
                id: z.number(),
                goodJobId: z.number(),
                fromUserId: z.number(),
                toUserId: z.number(),
                date: z.string(),
              }),
              currentOwner: z.object({
                id: z.number(),
                name: z.string(),
              }),
            }),
          },
        },
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

    const goodJobRepo = new GoodJobRepository(db);
    const userRepo = new UserRepository(db);
    const gjid =
      data.body.goodJobId ??
      (await goodJobRepo.getReceivedBeforeGoodJobs(user.userId)).id;
    // Verificar que el usuario de destino existe
    await userRepo.getById(data.body.toUserId);

    // Transferir (esto actualiza automáticamente el propietario actual)
    const transfer = await goodJobRepo.addTransfer({
      goodJobId: gjid,

      fromUserId: user.userId,
      toUserId: data.body.toUserId,
    });

    // Obtener el propietario actual (ahora es rápido, sin buscar en transferencias)
    const currentOwner = await goodJobRepo.getCurrentOwner(gjid);

    return {
      success: true,
      transfer: {
        id: transfer.id,
        goodJobId: transfer.goodJobId,
        fromUserId: transfer.fromUserId,
        toUserId: transfer.toUserId,
        date: transfer.date.toISOString(),
      },
      currentOwner: {
        id: currentOwner!.id,
        name: currentOwner!.name,
      },
    };
  }
}
