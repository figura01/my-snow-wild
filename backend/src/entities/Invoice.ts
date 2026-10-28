import { Field, ID, Int, ObjectType } from "type-graphql";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Reservation } from "./Reservation";

/** Ligne de facture, figée au moment de l'émission. Montants TTC en centimes. */
export type InvoiceLine = {
  label: string;
  size: string;
  quantity: number;
  days: number;
  unitPriceCents: number; // prix par jour et par article
  totalCents: number;
};

/**
 * Facture d'une réservation payée.
 * Tout ce qui figure sur le document est recopié ici à l'émission (client, lignes,
 * montants, taux de TVA) : modifier ensuite un profil, un prix ou un article ne change
 * jamais une facture déjà émise. Une réservation a au plus une facture.
 */
@ObjectType()
@Entity()
export class Invoice {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field({ description: "Numéro chronologique, sans trou, par année : FA-2026-0001." })
  @Index({ unique: true })
  @Column({ length: 20 })
  number: string;

  @Column({ type: "int" })
  year: number;

  @Column({ type: "int" })
  sequence: number;

  @OneToOne(() => Reservation, { onDelete: "RESTRICT", nullable: false })
  @JoinColumn()
  reservation: Reservation;

  @Column({ type: "uuid", unique: true })
  reservationId: string;

  @Field()
  @Column({ type: "timestamptz" })
  issuedAt: Date;

  // --- Client (copie des coordonnées de facturation) ------------------------
  @Column() customerName: string;
  @Column() customerEmail: string;
  @Column() customerAddress: string;
  @Column({ length: 10 }) customerPostalCode: string;
  @Column() customerCity: string;

  // --- Prestation ----------------------------------------------------------
  @Column({ type: "date" }) periodStart: string;
  @Column({ type: "date" }) periodEnd: string;
  @Column({ type: "jsonb" }) lines: InvoiceLine[];

  // --- Montants (centimes) -------------------------------------------------
  @Column({ type: "int", comment: "Taux de TVA en points de base : 2000 = 20 %." })
  vatRateBps: number;

  @Field(() => Int) @Column({ type: "int" }) totalHtCents: number;
  @Field(() => Int) @Column({ type: "int" }) vatCents: number;
  @Field(() => Int) @Column({ type: "int" }) totalTtcCents: number;

  @Column({ type: "varchar", nullable: true, comment: "Référence du paiement Stripe, pour le rapprochement." })
  paymentReference: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
