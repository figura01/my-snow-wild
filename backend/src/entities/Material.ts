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
import { Category } from "./Category";
import { MaterialImage } from "./MaterialImage";
import { MaterialVariant } from "./MaterialVariant";

export enum MaterialLevel {
  ALL = "ALL",
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  EXPERT = "EXPERT",
}

registerEnumType(MaterialLevel, {
  name: "MaterialLevel",
  description: "Niveau conseillé : tous niveaux, débutant, intermédiaire, confirmé.",
});

// Une référence produit (ex. « Ski All Mountain »). Le stock est géré
// par taille, dans MaterialVariant.
@ObjectType()
@Entity()
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

  // Tailles disponibles et stock par taille (chargées avec le matériel).
  @Field(() => [MaterialVariant])
  @OneToMany(() => MaterialVariant, (variant) => variant.material, {
    cascade: true,
    eager: true,
  })
  variants: MaterialVariant[];

  // Photos (galerie de la fiche produit), chargées avec le matériel.
  @OneToMany(() => MaterialImage, (image) => image.material, { eager: true })
  images: MaterialImage[];

  @Field(() => MaterialLevel, { nullable: true, description: "Niveau conseillé." })
  @Column({ type: "enum", enum: MaterialLevel, nullable: true })
  level: MaterialLevel | null;

  @Field(() => [String], { description: "Points forts affichés sur la fiche produit." })
  @Column("text", { array: true, default: () => "'{}'" })
  features: string[];

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
