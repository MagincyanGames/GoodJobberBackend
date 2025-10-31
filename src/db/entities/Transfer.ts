import { Entity, PrimaryKey, Column, ManyToOne } from "../decorators";

@Entity("transfers")
export class Transfer {
  @PrimaryKey({ autoIncrement: true })
  id!: number;

  @Column({
    type: "timestamp",
    notNull: true,
  })
  date!: Date;

  @ManyToOne(() => require("./User").User, { fieldName: "fromUserId" })
  fromUser!: any;

  @Column({ type: "integer", notNull: true })
  fromUserId!: number;

  @ManyToOne(() => require("./User").User, { fieldName: "toUserId" })
  toUser!: any;

  @Column({ type: "integer", notNull: true })
  toUserId!: number;

  @ManyToOne(() => require("./GoodJob").GoodJob, { fieldName: "goodJobId" })
  goodJob!: any;

  @Column({ type: "integer", notNull: true })
  goodJobId!: number;

  @Column({
    name: "balance_after_from",
    type: "integer",
    notNull: true,
  })
  balanceAfterFrom!: number;

  @Column({
    name: "balance_after_to",
    type: "integer",
    notNull: true,
  })
  balanceAfterTo!: number;
}
