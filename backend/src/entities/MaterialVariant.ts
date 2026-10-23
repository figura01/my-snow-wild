import { Field, ID, Int, ObjectType } from "type-graphql";
import { Check, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Material } from "./Material";

// Une taille d'une référence produit, avec son propre stock.
// Ex. « Ski All Mountain » en 160 cm : 4 exemplaires.
@ObjectType()
@Entity()
@Unique(["material", "size"])
@Check(`"stock" >= 0`)
export class MaterialVariant {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Material, (material) => material.variants, {
    nullable: false,
    onDelete: "CASCADE",
  })
  material: Material;

  @Field({ description: "Libellé de la taille : « 160 cm », « 42 », « M », « Taille unique »…" })
  @Column({ length: 40 })
  size: string;

  @Field(() => Int, { description: "Exemplaires de cette taille." })
  @Column({ type: "int", default: 0 })
  stock: number;

  @Field(() => Int)
  @Column({ type: "int", default: 0 })
  position: number;
}
