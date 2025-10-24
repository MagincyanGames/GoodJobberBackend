import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { GoodJobRepository } from "../repositories/GoodJobRepository";

export class GoodJobFetch extends OpenAPIRoute {
  schema = {
    tags: ["GoodJobs"],
    summary: "Get a GoodJob by ID (public)",
    security: [],
    request: {
      params: z.object({
        id: Num(),
      }),
      query: z.object({
        includeHistory: z.boolean().optional(),
      }),
    },
    responses: {
      "200": {
        description: "GoodJob details",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              goodJob: z.any(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const db = c.get("db");

    const goodJobRepo = new GoodJobRepository(db);
    const includeHistory = data.query?.includeHistory ?? false;

    // Ahora puedes elegir si cargar el historial o no
    // Por defecto solo trae el propietario actual (rápido)
    const goodJob = await goodJobRepo.getById(data.params.id, includeHistory);

    return {
      success: true,
      goodJob: {
        id: goodJob.id,
        generatedDate: goodJob.generatedDate.toISOString(),
        currentOwner: goodJob.currentOwner
          ? {
              id: goodJob.currentOwner.id,
              name: goodJob.currentOwner.name,
            }
          : null,
        lastTransferDate: goodJob.lastTransferDate?.toISOString() || null,
        transfers: includeHistory
          ? goodJob.transfers?.map((t) => ({
              id: t.id,
              date: t.date.toISOString(),
              from: { id: t.fromUser.id, name: t.fromUser.name },
              to: { id: t.toUser.id, name: t.toUser.name },
            }))
          : undefined,
      },
    };
  }
}
