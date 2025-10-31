import {
  Entity,
  PrimaryKey,
  Column,
  ManyToOne,
  OneToMany,
} from "../decorators";
import { Transfer } from "./Transfer";
import { User } from "./User";

@Entity("good_jobs")
export class GoodJob {
  @PrimaryKey({ autoIncrement: true })
  id!: number;

  @Column({
    name: "generated_date",
    type: "timestamp",
    notNull: true,
  })
  generatedDate!: Date;

  @ManyToOne(() => User, { fieldName: "currentOwnerId" })
  currentOwner?: User;

  @Column({ type: "integer" })
  currentOwnerId?: number;

  @Column({
    name: "last_transfer_date",
    type: "timestamp",
  })
  lastTransferDate?: Date;

  // Relaciones
  @OneToMany(() => Transfer, { mappedBy: "goodJob" })
  transfers?: Transfer[];
}
