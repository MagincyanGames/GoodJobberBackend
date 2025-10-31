import { Entity, PrimaryKey, Column, OneToMany } from "../decorators";

@Entity("users")
export class User {
  @PrimaryKey({ autoIncrement: true })
  id!: number;

  @Column({ type: "text", notNull: true })
  name!: string;

  @Column({ type: "text", notNull: true })
  hash!: string;

  @Column({
    name: "is_admin",
    type: "boolean",
    notNull: true,
    default: false,
  })
  isAdmin!: boolean;

  // Relaciones (las clases se resuelven dinámicamente para evitar imports circulares)
  @OneToMany(() => require("./Transfer").Transfer, {
    mappedBy: "fromUser",
    relationName: "from",
  })
  transfersFrom?: any[];

  @OneToMany(() => require("./Transfer").Transfer, {
    mappedBy: "toUser",
    relationName: "to",
  })
  transfersTo?: any[];

  @OneToMany(() => require("./GoodJob").GoodJob, { mappedBy: "currentOwner" })
  ownedGoodJobs?: any[];
}
