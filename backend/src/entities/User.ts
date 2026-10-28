import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

registerEnumType(UserRole, {
  name: "UserRole",
  description: "Rôle de l'utilisateur : ADMIN accède au back-office.",
});

// Une même classe sert d'entité TypeORM (table « user ») et de type GraphQL.
// Seuls les champs décorés par @Field sont exposés dans l'API :
// le mot de passe haché n'est donc jamais renvoyé au client.
@ObjectType()
@Entity()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  // --- Coordonnées de facturation enregistrées (facultatives), préremplies à la commande ---
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

  @Field(() => UserRole)
  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
