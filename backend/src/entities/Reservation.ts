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

// Une réservation non payée bloque le matériel pendant ce délai, puis le libère.
export const PAYMENT_DELAY_MINUTES = 35;

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

  // --- Facturation ---------------------------------------------------------
  @Field() @Column() billingFirstName: string;
  @Field() @Column() billingLastName: string;
  @Field() @Column() billingEmail: string;
  @Field() @Column() billingPhone: string;
  @Field() @Column() billingAddress: string;
  @Field() @Column({ length: 10 }) billingPostalCode: string;
  @Field() @Column() billingCity: string;

  // --- Paiement ------------------------------------------------------------
  @Field(() => Date, { nullable: true, description: "Fin du blocage si la réservation n'est pas payée." })
  @Column({ type: "timestamptz", nullable: true })
  expiresAt: Date | null;

  @Field(() => Date, { nullable: true })
  @Column({ type: "timestamptz", nullable: true })
  paidAt: Date | null;

  @Column({ type: "varchar", nullable: true })
  stripeSessionId: string | null;

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
