import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Field, ID, InputType, Int } from "type-graphql";
import { MaterialLevel } from "../entities/Material";

@InputType()
export class CategoryInput {
  @Field()
  @MinLength(2, { message: "Le nom doit contenir au moins 2 caractères." })
  @MaxLength(60)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

@InputType()
export class VariantInput {
  @Field(() => ID, { nullable: true, description: "Absent pour une nouvelle taille." })
  @IsOptional()
  @IsUUID("4")
  id?: string;

  @Field()
  @MinLength(1, { message: "Chaque taille doit avoir un libellé." })
  @MaxLength(40)
  size: string;

  @Field(() => Int)
  @IsInt()
  @Min(0, { message: "Le stock ne peut pas être négatif." })
  @Max(10_000)
  stock: number;
}

@InputType()
export class MaterialInput {
  @Field()
  @MinLength(2, { message: "Le nom doit contenir au moins 2 caractères." })
  @MaxLength(120)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: "L'URL de l'image est invalide." })
  imageUrl?: string;

  @Field(() => MaterialLevel, { nullable: true })
  @IsOptional()
  @IsEnum(MaterialLevel)
  level?: MaterialLevel | null;

  @Field(() => [String], { nullable: true, description: "Points forts (12 au plus)." })
  @IsOptional()
  @ArrayMaxSize(12, { message: "12 points forts au maximum." })
  @MaxLength(120, { each: true, message: "Chaque point fort fait 120 caractères au plus." })
  features?: string[] | null;

  @Field(() => Int)
  @IsInt()
  @Min(0, { message: "Le prix ne peut pas être négatif." })
  @Max(100_000_00)
  dailyPriceCents: number;

  @Field(() => [VariantInput], { description: "Tailles et stock par taille (au moins une)." })
  @ArrayMinSize(1, { message: "Ajoute au moins une taille (ou « Taille unique »)." })
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  variants: VariantInput[];

  @Field({ defaultValue: true })
  @IsBoolean()
  isActive: boolean;

  @Field()
  @IsUUID("4", { message: "Catégorie invalide." })
  categoryId: string;
}
