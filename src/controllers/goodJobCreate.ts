import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { GoodJobRepository } from "../repositories/GoodJobRepository";
import { GoodJob } from "../db/entities";

export class GoodJobCreate extends OpenAPIRoute {
  schema = {
    tags: ["GoodJobs"],
    summary: "Create a new GoodJob",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              generatedDate: z.string().datetime().optional(),
              initialOwnerId: z.number().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "GoodJob created successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              goodJob: z.object({
                id: z.number(),
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

    const goodJobRepo = new GoodJobRepository(db);
    const goodJob = await goodJobRepo.create({
      generatedDate: new Date(),
      initialOwnerId: data.body.initialOwnerId,
    });

    // Siempre cargar con el propietario para tener datos completos
    const fullGoodJob = await goodJobRepo.getById(goodJob.id);

    return {
      success: true,
      goodJob: {
        id: fullGoodJob.id,
        generatedDate: fullGoodJob.generatedDate.toISOString(),
        currentOwnerId: fullGoodJob.currentOwner
          ? {
              id: fullGoodJob.currentOwner.id,
              name: fullGoodJob.currentOwner.name,
            }
          : null,
        lastTransferDate: fullGoodJob.lastTransferDate?.toISOString() || null,
      },
    };
  }
}
