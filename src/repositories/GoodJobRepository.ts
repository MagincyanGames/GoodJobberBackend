import { eq, desc, and } from "drizzle-orm";
import { DbClient } from "../db/client";
import { GoodJob, goodJobs, transfers, users } from "../db/schema";
import { NotFoundException, InputValidationException } from "chanfana";

export class GoodJobRepository {
  constructor(private db: DbClient) {}

  async getById(id: number): Promise<GoodJob> {
    const result = await this.db
      .select({
        id: goodJobs.id,
        generatedDate: goodJobs.generatedDate,
        currentOwnerId: goodJobs.currentOwnerId,
        lastTransferDate: goodJobs.lastTransferDate,
        currentOwner: users,
      })
      .from(goodJobs)
      .leftJoin(users, eq(goodJobs.currentOwnerId, users.id))
      .where(eq(goodJobs.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`GoodJob with id ${id} not found`);
    }

    return result[0] as GoodJob;
  }

  async getAll(): Promise<GoodJob[]> {
    return (await this.db.select().from(goodJobs)) as GoodJob[];
  }

  async create(data: {
    generatedDate?: Date;
    initialOwnerId?: number;
  }): Promise<GoodJob> {
    // Si se especifica un propietario inicial, verificar que NO es administrador
    if (data.initialOwnerId) {
      const ownerResult = await this.db
        .select()
        .from(users)
        .where(eq(users.id, data.initialOwnerId));

      if (ownerResult.length > 0 && ownerResult[0].isAdmin) {
        throw new InputValidationException(
          "Administrators cannot own GoodJobs"
        );
      }
    }

    const result = await this.db
      .insert(goodJobs)
      .values({
        generatedDate: data.generatedDate || new Date(),
        currentOwnerId: data.initialOwnerId || null,
        lastTransferDate: data.initialOwnerId ? new Date() : null,
      })
      .returning();

    return result[0] as GoodJob;
  }

  async delete(id: number): Promise<GoodJob> {
    // Primero eliminar las transferencias asociadas
    await this.db.delete(transfers).where(eq(transfers.goodJobId, id));

    // Luego eliminar el GoodJob
    const rawResult = await this.db
      .delete(goodJobs)
      .where(eq(goodJobs.id, id))
      .returning();

    // Normalize result which may be an array or a D1Result-like object with a `results` array
    const rows = Array.isArray(rawResult)
      ? rawResult
      : (rawResult as any)?.results ?? [];

    if (rows.length === 0) {
      throw new NotFoundException(`GoodJob with id ${id} not found`);
    }

    return rows[0] as GoodJob;
  }

  async getLastTransfer(goodJobId: number) {
    const result = await this.db
      .select()
      .from(transfers)
      .where(eq(transfers.goodJobId, goodJobId))
      .orderBy(desc(transfers.date))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  async addTransfer(data: {
    goodJobId: number;
    fromUserId: number;
    toUserId: number;
    date?: Date;
  }) {
    // Verificar que el GoodJob existe
    const gj = await this.getById(data.goodJobId);

    if (gj.currentOwnerId !== data.fromUserId) {
      throw new InputValidationException(
        "You only can transfer your own GoodJobs"
      );
    }
    const transferDate = data.date || new Date();

    // Verificar que el destinatario NO es administrador
    const toUserResult = await this.db
      .select()
      .from(users)
      .where(eq(users.id, data.toUserId));

    if (toUserResult.length > 0 && toUserResult[0].isAdmin) {
      throw new InputValidationException(
        "Administrators cannot receive GoodJobs"
      );
    }

    // Calcular balances
    const fromUserGoodJobs = await this.db
      .select()
      .from(goodJobs)
      .where(eq(goodJobs.currentOwnerId, data.fromUserId));

    const toUserGoodJobs = await this.db
      .select()
      .from(goodJobs)
      .where(eq(goodJobs.currentOwnerId, data.toUserId));

    // Balance del remitente después de enviar (resta 1)
    const balanceFrom = fromUserGoodJobs.length - 1;
    // Balance del destinatario después de recibir (suma 1)
    const balanceTo = toUserGoodJobs.length + 1;

    // 1. Crear la transferencia con los balances
    const transfer = await this.db
      .insert(transfers)
      .values({
        goodJobId: data.goodJobId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        date: transferDate,
        balanceAfterFrom: balanceFrom,
        balanceAfterTo: balanceTo,
      })
      .returning();

    // 2. Actualizar el propietario actual del GoodJob
    await this.db
      .update(goodJobs)
      .set({
        currentOwnerId: data.toUserId,
        lastTransferDate: transferDate,
      })
      .where(eq(goodJobs.id, data.goodJobId));

    return transfer[0];
  }

  async getCurrentOwner(goodJobId: number) {
    const goodJobResult = await this.db
      .select()
      .from(goodJobs)
      .where(eq(goodJobs.id, goodJobId));

    if (goodJobResult.length === 0) {
      throw new NotFoundException(`GoodJob with id ${goodJobId} not found`);
    }

    const goodJob = goodJobResult[0];

    if (!goodJob.currentOwnerId) {
      return null;
    }

    const ownerResult = await this.db
      .select()
      .from(users)
      .where(eq(users.id, goodJob.currentOwnerId));

    return ownerResult.length > 0 ? ownerResult[0] : null;
  }

  async getByOwner(ownerId: number): Promise<GoodJob[]> {
    return (await this.db
      .select()
      .from(goodJobs)
      .where(eq(goodJobs.currentOwnerId, ownerId))) as GoodJob[];
  }

  async countByOwner(ownerId: number): Promise<number> {
    const result = await this.db
      .select()
      .from(goodJobs)
      .where(eq(goodJobs.currentOwnerId, ownerId));

    return result.length;
  }

  async getReceivedBeforeGoodJobs(ownerId: number): Promise<GoodJob | null> {
    // Obtener todos los GoodJobs que el usuario tiene actualmente
    const currentGoodJobs = await this.getByOwner(ownerId);

    if (currentGoodJobs.length === 0) {
      return null;
    }

    // Separar en dos categorías:
    // 1. GoodJobs sin transferencias (creados directamente)
    // 2. GoodJobs recibidos múltiples veces

    const withoutTransfers: GoodJob[] = [];
    const receivedBefore: Array<{ goodJob: GoodJob; firstTransferDate: Date }> =
      [];

    for (const goodJob of currentGoodJobs) {
      const transfersReceived = await this.db
        .select()
        .from(transfers)
        .where(
          and(
            eq(transfers.goodJobId, goodJob.id),
            eq(transfers.toUserId, ownerId)
          )
        )
        .orderBy(desc(transfers.date));

      // Si no tiene transferencias asociadas
      if (transfersReceived.length === 0) {
        withoutTransfers.push(goodJob);
      }
      // Si tiene más de una transferencia, lo recibió antes
      else if (transfersReceived.length > 1) {
        // Obtener la fecha de la primera transferencia (la más antigua)
        const firstTransferDate =
          transfersReceived[transfersReceived.length - 1].date;
        receivedBefore.push({ goodJob, firstTransferDate });
      }
    }

    // Prioridad 1: Si hay GoodJobs sin transferencias, devolver el primero
    if (withoutTransfers.length > 0) {
      return withoutTransfers[0];
    }

    // Prioridad 2: Si hay GoodJobs recibidos antes, devolver el más antiguo
    if (receivedBefore.length > 0) {
      receivedBefore.sort(
        (a, b) => a.firstTransferDate.getTime() - b.firstTransferDate.getTime()
      );
      return receivedBefore[0].goodJob;
    }

    return null;
  }
}
