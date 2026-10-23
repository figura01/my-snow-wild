import { Field, ID, Int, ObjectType, registerEnumType } from "type-graphql";
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ReservationItem } from "./ReservationItem";
import { User } from "./User";

export enum ReservationStatus {
  PENDING = "PENDING", // créée, en attente de paiement
  PAID = "PAID", // payée : le matériel est bloqué sur la période
  CANCELLED = "CANCELLED", // annulée : le matériel est de nouveau disponible
}

registerEnumType(ReservationStatus, { name: "ReservationStatus" });

// Statuts qui immobilisent du matériel sur la période.
export const BLOCKING_STATUSES = [ReservationStatus.PENDING, ReservationStatus.PAID];

// Une réservation porte sur une seule période (du … au …, jours inclus)
// et contient une ou plusieurs lignes de matériel.
@ObjectType()
@Entity()
@Check(`"endDate" >= "startDate"`)
export class Reservation {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL", eager: true })
  user?: User | null;

  @Field({ description: "Premier jour de location (AAAA-MM-JJ)." })
  @Column({ type: "date" })
  startDate: string;

  @Field({ description: "Dernier jour de location, inclus (AAAA-MM-JJ)." })
  @Column({ type: "date" })
  endDate: string;

  @Field(() => ReservationStatus)
  @Column({ type: "enum", enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @Field(() => Int, { description: "Montant total en centimes." })
  @Column({ type: "int", default: 0 })
  totalCents: number;

  @Field(() => [ReservationItem])
  @OneToMany(() => ReservationItem, (item) => item.reservation, { cascade: true, eager: true })
  items: ReservationItem[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
