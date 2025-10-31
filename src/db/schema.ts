import { buildSchema, getTable } from "./decorators";
import { User, GoodJob, Transfer } from "./entities";

// Construir el esquema a partir de las entidades decoradas
const schema = buildSchema([User, GoodJob, Transfer]);

// Exportar las tablas
export const users = getTable(User);
export const goodJobs = getTable(GoodJob);
export const transfers = getTable(Transfer);

// Exportar las relaciones
export const usersRelations = schema.relations.usersRelations;
export const goodJobsRelations = schema.relations.good_jobsRelations;
export const transfersRelations = schema.relations.transfersRelations;

// Exportar las clases de entidades para usar en repositories
export { User, GoodJob, Transfer };
