import { ArrayMaxSize, IsInt, IsUUID, Max, Min, ValidateNested } from "class-validator";
import { Arg, Authorized, Ctx, Field, ID, InputType, Int, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import type { Context } from "../auth/context";
import { Reservation } from "../entities/Reservation";
import { findDraft, saveDraft } from "../services/cart";
import { buildQuote, MAX_LINES, MAX_QUANTITY_PER_LINE } from "../services/quote";

@InputType()
export class CartItemInput {
  @Field(() => ID)
  @IsUUID("4")
  variantId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY_PER_LINE)
  quantity: number;
}

@InputType()
export class CartInput {
  @Field({ description: "AAAA-MM-JJ" })
  startDate: string;

  @Field({ description: "AAAA-MM-JJ, inclus" })
  endDate: string;

  @Field(() => [CartItemInput])
  @ArrayMaxSize(MAX_LINES)
  @ValidateNested({ each: true })
  items: CartItemInput[];
}

@ObjectType()
class CartQuoteLine {
  @Field(() => ID) variantId: string;
  @Field(() => ID, { nullable: true }) materialId: string | null;
  @Field() materialName: string;
  @Field(() => String, { nullable: true }) materialSlug: string | null;
  @Field() size: string;
  @Field(() => Int) quantity: number;
  @Field(() => Int, { description: "Exemplaires libres sur la période." }) available: number;
  @Field(() => Int) dailyPriceCents: number;
  @Field(() => Int) lineTotalCents: number;
  @Field() ok: boolean;
  @Field(() => String, { nullable: true }) message: string | null;
}

@ObjectType()
class CartQuote {
  @Field() startDate: string;
  @Field() endDate: string;
  @Field(() => Int) days: number;
  @Field(() => [CartQuoteLine]) lines: CartQuoteLine[];
  @Field(() => Int, { description: "Total en centimes des lignes valides." }) totalCents: number;
  @Field({ description: "Vrai si toutes les lignes peuvent être réservées." }) valid: boolean;
}

@Resolver()
export class CartResolver {
  @Query(() => CartQuote, {
    description: "Recalcule le panier : prix et disponibilité viennent de la base, jamais du client.",
  })
  quoteCart(@Arg("cart") cart: CartInput): Promise<CartQuote> {
    return buildQuote(cart.startDate, cart.endDate, cart.items);
  }

  // --- Panier en base (client connecté) -----------------------------------------

  @Authorized()
  @Query(() => Reservation, { nullable: true, description: "Panier en cours du client (réservation DRAFT)." })
  myCart(@Ctx() ctx: Context): Promise<Reservation | null> {
    return findDraft(ctx.user!.sub);
  }

  @Authorized()
  @Mutation(() => Reservation, { nullable: true, description: "Enregistre le panier du client ; vide, il est supprimé." })
  saveCart(@Arg("cart") cart: CartInput, @Ctx() ctx: Context): Promise<Reservation | null> {
    return saveDraft(ctx.user!.sub, cart);
  }
}
