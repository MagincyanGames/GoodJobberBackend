import { eq, desc } from "drizzle-orm";
import { DbClient } from "../db/client";
import { users, transfers, User } from "../db/schema";
import { NotFoundException, InputValidationException } from "chanfana";

export class UserRepository {
  constructor(private db: DbClient) {}

  async getById(id: number): Promise<User> {
    const result = await this.db.select().from(users).where(eq(users.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return result[0] as User;
  }

  async getByName(name: string): Promise<User> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.name, name));

    if (result.length === 0) {
      throw new NotFoundException(`User with name ${name} not found`);
    }

    return result[0] as User;
  }

  async getAll(): Promise<User[]> {
    return (await this.db.select().from(users)) as User[];
  }

  async create(data: {
    name: string;
    hash: string;
    isAdmin?: boolean;
  }): Promise<User> {
    // Verificar si ya existe
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.name, data.name));

    if (existing.length > 0) {
      throw new InputValidationException("User already exists");
    }

    const result = await this.db
      .insert(users)
      .values({
        name: data.name,
        hash: data.hash,
        isAdmin: data.isAdmin ?? false,
      })
      .returning();
    return result[0] as User;
  }

  async update(
    id: number,
    data: Partial<{ name: string; hash: string }>
  ): Promise<User> {
    const rawResult = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    const rows = Array.isArray(rawResult)
      ? rawResult
      : (rawResult as any)?.results ?? [];

    if (rows.length === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return rows[0] as User;
  }

  async delete(id: number): Promise<User> {
    const rawResult = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    const rows = Array.isArray(rawResult)
      ? rawResult
      : (rawResult as any)?.results ?? [];

    if (rows.length === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return rows[0] as User;
  }

  async getTransfersSent(userId: number) {
    const result = await this.db
      .select({
        id: transfers.id,
        date: transfers.date,
        fromUserId: transfers.fromUserId,
        toUserId: transfers.toUserId,
        goodJobId: transfers.goodJobId,
        balanceAfterFrom: transfers.balanceAfterFrom,
        balanceAfterTo: transfers.balanceAfterTo,
        toUser: users,
      })
      .from(transfers)
      .innerJoin(users, eq(transfers.toUserId, users.id))
      .where(eq(transfers.fromUserId, userId))
      .orderBy(desc(transfers.date));

    return result;
  }

  async getTransfersReceived(userId: number) {
    const fromUserAlias = users;

    const result = await this.db
      .select({
        id: transfers.id,
        date: transfers.date,
        fromUserId: transfers.fromUserId,
        toUserId: transfers.toUserId,
        goodJobId: transfers.goodJobId,
        balanceAfterFrom: transfers.balanceAfterFrom,
        balanceAfterTo: transfers.balanceAfterTo,
        fromUser: fromUserAlias,
      })
      .from(transfers)
      .innerJoin(fromUserAlias, eq(transfers.fromUserId, fromUserAlias.id))
      .where(eq(transfers.toUserId, userId))
      .orderBy(desc(transfers.date));

    return result;
  }

  async getAllTransactions(userId: number) {
    const sent = await this.getTransfersSent(userId);
    const received = await this.getTransfersReceived(userId);

    // Combinar y ordenar por fecha
    const all = [...sent, ...received].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    return all;
  }
}
