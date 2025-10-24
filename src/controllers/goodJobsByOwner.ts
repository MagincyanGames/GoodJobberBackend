import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { GoodJobRepository } from "../repositories/GoodJobRepository";

export class GoodJobsByOwner extends OpenAPIRoute {
  schema = {
    tags: ["GoodJobs"],
    summary: "Get all GoodJobs owned by a user (public)",
    security: [],
    request: {
      params: z.object({
        userId: Num(),
      }),
    },
    responses: {
      "200": {
        description: "List of GoodJobs owned by the user",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              goodJobs: z.array(z.any()),
              count: z.number(),
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

    // Consulta optimizada: obtiene directamente por propietario
    // Sin necesidad de buscar en todas las transferencias
    const goodJobs = await goodJobRepo.getByOwner(data.params.userId);

    return {
      success: true,
      count: goodJobs.length,
      goodJobs: goodJobs.map((gj) => ({
        id: gj.id,
        generatedDate: gj.generatedDate.toISOString(),
        currentOwner: gj.currentOwner
          ? {
              id: gj.currentOwner.id,
              name: gj.currentOwner.name,
            }
          : null,
        lastTransferDate: gj.lastTransferDate?.toISOString() || null,
      })),
    };
  }
}
