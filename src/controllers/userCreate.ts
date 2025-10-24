import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { AppContext } from "../types";
import { UserRepository } from "../repositories/UserRepository";

export class UserCreate extends OpenAPIRoute {
  schema = {
    tags: ["Users"],
    summary: "Create a new user",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: Str({ example: "John Doe" }),
              hash: Str({ example: "hashedpassword123" }),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "User created successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              user: z.object({
                id: z.number(),
                name: z.string(),
                hash: z.string(),
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

    const userRepo = new UserRepository(db);
    const user = await userRepo.create({
      name: data.body.name,
      hash: data.body.hash,
    });

    return {
      success: true,
      user,
    };
  }
}
