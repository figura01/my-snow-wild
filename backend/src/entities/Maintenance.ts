import { Field, ID, Int, ObjectType } from "type-graphql";
import { Check, Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MaterialVariant } from "./MaterialVariant";

// Exemplaires d'une taille sortis du parc pour entretien ou réparation.
// Tant que la maintenance est en cours (endedAt nul), ils ne sont pas louables,
// quelles que soient les dates. La date de retour prévue est indicative.
@ObjectType()
@Entity()
@Check(`"quantity" > 0`)
@Index(["variant", "endedAt"])
export class Maintenance {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => MaterialVariant)
  @ManyToOne(() => MaterialVariant, { nullable: false, onDelete: "CASCADE" })
  variant: MaterialVariant;

  @Field(() => Int, { description: "Nombre d'exemplaires immobilisés." })
  @Column({ type: "int" })
  quantity: number;

  @Field({ description: "Motif : « Carre abîmée », « Fixation à régler »…" })
  @Column({ length: 200 })
  reason: string;

  @Field(() => String, { nullable: true, description: "Retour prévu (AAAA-MM-JJ), indicatif." })
  @Column({ type: "date", nullable: true })
  expectedReturnDate: string | null;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  startedAt: Date;

  @Field(() => Date, { nullable: true, description: "Remise en service ; nul tant que la maintenance est en cours." })
  @Column({ type: "timestamptz", nullable: true })
  endedAt: Date | null;
}
