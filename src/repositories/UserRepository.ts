import { eq } from "drizzle-orm";
import { DbClient } from "../db/client";
import { users } from "../db/schema";
import { NotFoundException, InputValidationException } from "chanfana";

export class UserRepository {
  constructor(private db: DbClient) {}

  async getById(id: number) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async getByName(name: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.name, name),
    });

    if (!user) {
      throw new NotFoundException(`User with name ${name} not found`);
    }

    return user;
  }

  async getAll() {
    return await this.db.query.users.findMany();
  }

  async create(data: { name: string; hash: string }) {
    // Verificar si ya existe
    const existing = await this.db.query.users.findFirst({
      where: eq(users.name, data.name),
    });

    if (existing) {
      throw new InputValidationException("User already exists");
    }

    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<{ name: string; hash: string }>) {
    const result = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return result[0];
  }

  async delete(id: number) {
    const result = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return result[0];
  }
}
