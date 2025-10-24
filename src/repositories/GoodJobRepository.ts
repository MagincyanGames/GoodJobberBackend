import { eq, desc } from "drizzle-orm";
import { DbClient } from "../db/client";
import { goodJobs, transfers } from "../db/schema";
import { NotFoundException, InputValidationException } from "chanfana";

export class GoodJobRepository {
  constructor(private db: DbClient) {}

  async getById(id: number, includeTransfers: boolean = false) {
    const goodJob = await this.db.query.goodJobs.findFirst({
      where: eq(goodJobs.id, id),
      with: {
        currentOwner: true, // Siempre incluir el propietario actual
        transfers: includeTransfers
          ? {
              with: {
                fromUser: true,
                toUser: true,
              },
              orderBy: desc(transfers.date),
            }
          : undefined,
      },
    });

    if (!goodJob) {
      throw new NotFoundException(`GoodJob with id ${id} not found`);
    }

    return goodJob;
  }

  async getAll(includeTransfers: boolean = false) {
    return await this.db.query.goodJobs.findMany({
      with: {
        currentOwner: true, // Siempre incluir el propietario actual
        transfers: includeTransfers
          ? {
              with: {
                fromUser: true,
                toUser: true,
              },
              orderBy: desc(transfers.date),
            }
          : undefined,
      },
    });
  }

  async create(data: { generatedDate?: Date; initialOwnerId?: number }) {
    const result = await this.db
      .insert(goodJobs)
      .values({
        generatedDate: data.generatedDate || new Date(),
        currentOwnerId: data.initialOwnerId || null,
        lastTransferDate: data.initialOwnerId ? new Date() : null,
      })
      .returning();

    return result[0];
  }

  async delete(id: number) {
    // Primero eliminar las transferencias asociadas
    await this.db.delete(transfers).where(eq(transfers.goodJobId, id));

    // Luego eliminar el GoodJob
    const result = await this.db
      .delete(goodJobs)
      .where(eq(goodJobs.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`GoodJob with id ${id} not found`);
    }

    return result[0];
  }

  async getLastTransfer(goodJobId: number) {
    const transfer = await this.db.query.transfers.findFirst({
      where: eq(transfers.goodJobId, goodJobId),
      with: {
        fromUser: true,
        toUser: true,
      },
      orderBy: desc(transfers.date),
    });

    return transfer;
  }

  async addTransfer(data: {
    goodJobId: number;
    fromUserId: number;
    toUserId: number;
    date?: Date;
  }) {
    // Verificar que el GoodJob existe
    await this.getById(data.goodJobId);

    const transferDate = data.date || new Date();

    // Usar transacción para mantener coherencia
    return await this.db.transaction(async (tx) => {
      // 1. Crear la transferencia
      const transfer = await tx
        .insert(transfers)
        .values({
          goodJobId: data.goodJobId,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          date: transferDate,
        })
        .returning();

      // 2. Actualizar el propietario actual del GoodJob
      await tx
        .update(goodJobs)
        .set({
          currentOwnerId: data.toUserId,
          lastTransferDate: transferDate,
        })
        .where(eq(goodJobs.id, data.goodJobId));

      return transfer[0];
    });
  }

  async getCurrentOwner(goodJobId: number) {
    const goodJob = await this.db.query.goodJobs.findFirst({
      where: eq(goodJobs.id, goodJobId),
      with: {
        currentOwner: true,
      },
    });

    if (!goodJob) {
      throw new NotFoundException(`GoodJob with id ${goodJobId} not found`);
    }

    return goodJob.currentOwner;
  }

  async getByOwner(ownerId: number) {
    return await this.db.query.goodJobs.findMany({
      where: eq(goodJobs.currentOwnerId, ownerId),
      with: {
        currentOwner: true,
      },
    });
  }

  async countByOwner(ownerId: number) {
    const result = await this.db
      .select()
      .from(goodJobs)
      .where(eq(goodJobs.currentOwnerId, ownerId));

    return result.length;
  }
}
