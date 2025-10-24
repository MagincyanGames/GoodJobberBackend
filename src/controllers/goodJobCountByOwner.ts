import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { GoodJobRepository } from "../repositories/GoodJobRepository";

export class GoodJobCountByOwner extends OpenAPIRoute {
  schema = {
    tags: ["GoodJobs"],
    summary: "Get the count of GoodJobs owned by a user (public)",
    security: [],
    request: {
      params: z.object({
        userId: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Count of GoodJobs owned by the user",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              userId: z.number(),
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

    // Contar GoodJobs del usuario (consulta optimizada)
    const count = await goodJobRepo.countByOwner(data.params.userId);

    return {
      success: true,
      userId: data.params.userId,
      count,
    };
  }
}
