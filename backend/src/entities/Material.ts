import { Field, ID, Int, ObjectType } from "type-graphql";
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "./Category";

// Une référence produit (ex. « Ski All Mountain 160 cm ») et le nombre
// d'exemplaires identiques disponibles à la location.
@ObjectType()
@Entity()
@Check(`"stock" >= 0`)
@Check(`"dailyPriceCents" >= 0`)
export class Material {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  slug: string;

  @Field(() => String, { nullable: true })
  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: "varchar", nullable: true })
  imageUrl?: string | null;

  // Prix stocké en centimes (entier) pour éviter les erreurs d'arrondi des décimaux.
  @Field(() => Int, { description: "Prix de location par jour, en centimes d'euro." })
  @Column({ type: "int" })
  dailyPriceCents: number;

  @Field(() => Int, { description: "Nombre d'exemplaires en stock." })
  @Column({ type: "int", default: 0 })
  stock: number;

  @Field({ description: "Visible dans le catalogue public." })
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Category)
  @ManyToOne(() => Category, (category) => category.materials, {
    eager: true,
    nullable: false,
    onDelete: "RESTRICT",
  })
  category: Category;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
