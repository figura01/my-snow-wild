import { Field, ID, Int, ObjectType } from "type-graphql";
import { Check, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Material } from "./Material";
import { MaterialVariant } from "./MaterialVariant";
import { Reservation } from "./Reservation";

@ObjectType()
@Entity()
@Check(`"quantity" > 0`)
export class ReservationItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Reservation, (reservation) => reservation.items, { onDelete: "CASCADE" })
  reservation: Reservation;

  // La ligne porte sur une taille précise. RESTRICT : une taille déjà réservée
  // ne peut plus être supprimée, pour garder l'historique des commandes.
  @Field(() => MaterialVariant)
  @ManyToOne(() => MaterialVariant, { eager: true, onDelete: "RESTRICT" })
  variant: MaterialVariant;

  // Référence produit, dupliquée pour lire facilement l'historique.
  @Field(() => Material)
  @ManyToOne(() => Material, { eager: true, onDelete: "RESTRICT" })
  material: Material;

  @Field(() => Int)
  @Column({ type: "int" })
  quantity: number;

  // Prix figé au moment de la réservation : une hausse de tarif ultérieure
  // ne modifie pas les commandes passées.
  @Field(() => Int)
  @Column({ type: "int" })
  dailyPriceCents: number;
}
