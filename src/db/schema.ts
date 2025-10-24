import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Tabla de usuarios
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  hash: text("hash").notNull(),
});

// Tabla de GoodJobs
export const goodJobs = sqliteTable("good_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  generatedDate: integer("generated_date", { mode: "timestamp" }).notNull(),
  currentOwnerId: integer("current_owner_id").references(() => users.id),
  lastTransferDate: integer("last_transfer_date", { mode: "timestamp" }),
});

// Tabla de transferencias
export const transfers = sqliteTable("transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  fromUserId: integer("from_user_id")
    .notNull()
    .references(() => users.id),
  toUserId: integer("to_user_id")
    .notNull()
    .references(() => users.id),
  goodJobId: integer("good_job_id")
    .notNull()
    .references(() => goodJobs.id),
});

// Definir relaciones (como en JPA/Hibernate)
export const usersRelations = relations(users, ({ many }) => ({
  transfersFrom: many(transfers, { relationName: "from" }),
  transfersTo: many(transfers, { relationName: "to" }),
}));

export const goodJobsRelations = relations(goodJobs, ({ many, one }) => ({
  transfers: many(transfers),
  currentOwner: one(users, {
    fields: [goodJobs.currentOwnerId],
    references: [users.id],
  }),
}));

export const transfersRelations = relations(transfers, ({ one }) => ({
  fromUser: one(users, {
    fields: [transfers.fromUserId],
    references: [users.id],
    relationName: "from",
  }),
  toUser: one(users, {
    fields: [transfers.toUserId],
    references: [users.id],
    relationName: "to",
  }),
  goodJob: one(goodJobs, {
    fields: [transfers.goodJobId],
    references: [goodJobs.id],
  }),
}));
