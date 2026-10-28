import { IsEmail, IsOptional, Matches, MaxLength, MinLength } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail({}, { message: "Adresse e-mail invalide." })
  email: string;

  @Field()
  @MinLength(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
  @MaxLength(128)
  password: string;

  @Field()
  @MinLength(1, { message: "Le prénom est requis." })
  @MaxLength(100)
  firstName: string;

  @Field()
  @MinLength(1, { message: "Le nom est requis." })
  @MaxLength(100)
  lastName: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: "Adresse e-mail invalide." })
  email: string;

  @Field()
  @MinLength(1)
  password: string;
}

// Coordonnées enregistrées sur le compte. Téléphone et adresse sont facultatifs,
// mais validés comme au moment de commander s'ils sont renseignés.
@InputType()
export class ProfileInput {
  @Field()
  @MinLength(1, { message: "Le prénom est requis." })
  @MaxLength(100)
  firstName: string;

  @Field()
  @MinLength(1, { message: "Le nom est requis." })
  @MaxLength(100)
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^[0-9 +().-]{6,20}$/, { message: "Numéro de téléphone invalide." })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MinLength(3, { message: "L'adresse est trop courte." })
  @MaxLength(200)
  address?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\d{5}$/, { message: "Le code postal doit contenir 5 chiffres." })
  postalCode?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  city?: string | null;
}

@InputType()
export class PasswordInput {
  @Field()
  @MinLength(1)
  currentPassword: string;

  @Field()
  @MinLength(8, { message: "Le nouveau mot de passe doit contenir au moins 8 caractères." })
  @MaxLength(128)
  newPassword: string;
}
