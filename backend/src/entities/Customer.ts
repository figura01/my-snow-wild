import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { Column, CreateDateColumn, Entity, Index, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

export enum CustomerSource {
  SIGNUP = "SIGNUP", // inscription sur le site
  IMPORT = "IMPORT", // fichier CSV importé depuis le back-office
}

registerEnumType(CustomerSource, { name: "CustomerSource", description: "Origine de la fiche client." });

/**
 * Fiche client : identité et coordonnées (données personnelles).
 * Séparée du compte (User : e-mail de connexion, mot de passe, rôle) pour que
 * - les identifiants ne soient jamais lus par l'admin, l'export ou l'import ;
 * - un client puisse exister sans compte (fiche importée, et plus tard client au comptoir).
 * Une fiche a au plus un compte ; un compte a toujours sa fiche.
 */
@ObjectType()
@Entity()
export class Customer {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  // E-mail de contact, en minuscules. Pas unique : une fiche importée et un compte
  // créé ensuite avec la même adresse restent distincts tant que l'adresse n'est pas vérifiée.
  @Field()
  @Index()
  @Column()
  email: string;

  // --- Coordonnées de facturation (facultatives), préremplies à la commande ---
  @Field(() => String, { nullable: true })
  @Column({ type: "varchar", length: 20, nullable: true })
  phone: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: "varchar", length: 200, nullable: true })
  address: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: "varchar", length: 10, nullable: true })
  postalCode: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: "varchar", length: 100, nullable: true })
  city: string | null;

  @Field(() => CustomerSource)
  @Column({ type: "enum", enum: CustomerSource, default: CustomerSource.SIGNUP })
  source: CustomerSource;

  // Côté inverse : la clé étrangère est sur le compte (user.customerId).
  @OneToOne(() => User, (user) => user.customer)
  user?: User | null;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
