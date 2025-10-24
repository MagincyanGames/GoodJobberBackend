import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { UserRepository } from "../repositories/UserRepository";

export class UserList extends OpenAPIRoute {
  schema = {
    tags: ["Users"],
    summary: "List all users (public)",
    security: [],
    responses: {
      "200": {
        description: "List of users",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              users: z.array(
                z.object({
                  id: z.number(),
                  name: z.string(),
                  hash: z.string(),
                })
              ),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const db = c.get("db");

    const userRepo = new UserRepository(db);
    const users = await userRepo.getAll();

    return {
      success: true,
      users,
    };
  }
}
