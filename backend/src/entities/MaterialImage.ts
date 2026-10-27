import { Field, ID, Int, ObjectType } from "type-graphql";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Material } from "./Material";

// Photo d'un matériel. Le fichier est stocké sur le disque de l'API (dossier
// d'envoi, servi sous /uploads) ; la base ne garde que son nom et son ordre.
@ObjectType()
@Entity()
export class MaterialImage {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Material, (material) => material.images, { nullable: false, onDelete: "CASCADE" })
  material: Material;

  // Nom aléatoire généré par l'API (« <uuid>.webp ») : jamais le nom choisi par l'utilisateur.
  @Column({ length: 80 })
  filename: string;

  @Field({ description: "Texte alternatif (accessibilité)." })
  @Column({ length: 200, default: "" })
  alt: string;

  @Field(() => Int, { description: "Ordre d'affichage ; la première photo est la photo principale." })
  @Column({ type: "int", default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;
}
