import { IsEmail, MaxLength, MinLength } from "class-validator";
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
