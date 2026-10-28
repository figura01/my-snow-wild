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

/**
 * Cycle de vie d'une réservation :
 *   DRAFT ──(commande)──▶ PENDING ──(paiement)──▶ PAID
 *                            │
 *                            ├──(délai dépassé)──▶ EXPIRED
 *                            └──(abandon Stripe)─▶ CANCELLED
 * Seules PAID et PENDING (dans son délai) bloquent du matériel.
 */
export enum ReservationStatus {
  DRAFT = "DRAFT", // panier d'un client connecté, pas encore commandé : ne bloque rien
  PENDING = "PENDING", // commandée, en attente de paiement : bloque le matériel pendant le délai
  PAID = "PAID", // payée : le matériel est bloqué sur la période
  EXPIRED = "EXPIRED", // non payée dans le délai : le matériel est libéré
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

  // Ancien parcours (page Stripe Checkout), conservé pour l'historique.
  @Column({ type: "varchar", nullable: true })
  stripeSessionId: string | null;

  // Paiement intégré au site : PaymentIntent Stripe de la réservation.
  @Column({ type: "varchar", nullable: true })
  stripePaymentIntentId: string | null;

  @Field(() => Int, { description: "Montant total en centimes." })
  @Column({ type: "int", default: 0 })
  totalCents: number;

  @Field(() => [ReservationItem])
  @OneToMany(() => ReservationItem, (item) => item.reservation, { cascade: true, eager: true })
  items: ReservationItem[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field({ description: "Dernière modification (utile pour les paniers en cours)." })
  @UpdateDateColumn()
  updatedAt: Date;
}
