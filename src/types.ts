import { DateTime, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import type { DbClient } from "./db/client";
import type { JWTPayload } from "./services/AuthService";

export interface Env {
  good_job_db: D1Database;
  JWT_SECRET: string;
  services: {};
  repositories: {};
}

export type AppContext = Context<{
  Bindings: Env;
  Variables: {
    db: DbClient;
    user?: JWTPayload;
  };
}>;

export const Task = z.object({
  name: Str({ example: "lorem" }),
  slug: Str(),
  description: Str({ required: false }),
  completed: z.boolean().default(false),
  due_date: DateTime(),
});
