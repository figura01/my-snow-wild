import { Field, ID, Int, ObjectType } from "type-graphql";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Material } from "./Material";

// Photo d'un matériel. Le fichier vit dans un stockage (disque local ou Cloudinary,
// voir services/storage.ts) ; la base garde le stockage, la clé du fichier et l'ordre.
@ObjectType()
@Entity()
export class MaterialImage {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Material, (material) => material.images, { nullable: false, onDelete: "CASCADE" })
  material: Material;

  @Column({ length: 20, default: "local" })
  storage: string;

  // Clé générée par l'API (nom de fichier ou identifiant Cloudinary), jamais un nom choisi par l'utilisateur.
  @Column({ length: 200 })
  key: string;

  @Field({ description: "Texte alternatif (accessibilité)." })
  @Column({ length: 200, default: "" })
  alt: string;

  @Field(() => Int, { description: "Ordre d'affichage ; la première photo est la photo principale." })
  @Column({ type: "int", default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;
}
