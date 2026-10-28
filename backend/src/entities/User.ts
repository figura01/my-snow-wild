import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Customer } from "./Customer";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

registerEnumType(UserRole, {
  name: "UserRole",
  description: "Rôle de l'utilisateur : ADMIN accède au back-office.",
});

// Compte de connexion : e-mail, mot de passe haché, rôle. Une même classe sert
// d'entité TypeORM (table « user ») et de type GraphQL ; seuls les champs décorés
// par @Field sont exposés : le mot de passe haché n'est jamais renvoyé.
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

  // Identité et coordonnées : dans la fiche client (voir Customer). Les champs
  // firstName, lastName, phone… restent exposés sur User par l'API (UserResolver).
  @OneToOne(() => Customer, (customer) => customer.user, { eager: true, nullable: false, onDelete: "RESTRICT" })
  @JoinColumn()
  customer: Customer;

  @Field(() => UserRole)
  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
