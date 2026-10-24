import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEmail,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import type { Context } from "../auth/context";
import { AppDataSource } from "../data-source";
import { Reservation, ReservationStatus } from "../entities/Reservation";
import { UserRole } from "../entities/User";
import { createPaymentSession, isStripeSessionPaid, paymentMode } from "../services/payment";
import { MAX_LINES } from "../services/quote";
import {
  allReservations,
  createPendingReservation,
  findReservation,
  isExpired,
  markCancelled,
  markPaid,
  userReservations,
} from "../services/reservations";
import { badInput, notFound } from "../utils/errors";
import { CartItemInput } from "./CartResolver";

@InputType()
class BillingInput {
  @Field() @MinLength(1, { message: "Le prénom est requis." }) @MaxLength(100) firstName: string;
  @Field() @MinLength(1, { message: "Le nom est requis." }) @MaxLength(100) lastName: string;
  @Field() @IsEmail({}, { message: "Adresse e-mail invalide." }) email: string;
  @Field()
  @Matches(/^[0-9 +().-]{6,20}$/, { message: "Numéro de téléphone invalide." })
  phone: string;
  @Field() @MinLength(3, { message: "L'adresse est requise." }) @MaxLength(200) address: string;
  @Field() @Matches(/^\d{5}$/, { message: "Le code postal doit contenir 5 chiffres." }) postalCode: string;
  @Field() @MinLength(1, { message: "La ville est requise." }) @MaxLength(100) city: string;
}

@InputType()
class CheckoutInput {
  @Field() startDate: string;
  @Field() endDate: string;

  @Field(() => [CartItemInput])
  @ArrayMinSize(1, { message: "Ton panier est vide." })
  @ArrayMaxSize(MAX_LINES)
  @ValidateNested({ each: true })
  items: CartItemInput[];

  @Field(() => BillingInput)
  @ValidateNested()
  billing: BillingInput;
}

@ObjectType()
class CheckoutResult {
  @Field(() => ID) reservationId: string;
  @Field({ description: "Page de paiement (Stripe ou simulée) vers laquelle rediriger." }) paymentUrl: string;
}

function canSee(ctx: Context, reservation: Reservation) {
  return ctx.user?.role === UserRole.ADMIN || reservation.user?.id === ctx.user?.sub;
}

@Resolver(() => Reservation)
export class ReservationResolver {
  @FieldResolver(() => Boolean, { description: "Non payée dans le délai : le matériel a été libéré." })
  isExpired(@Root() reservation: Reservation): boolean {
    return isExpired(reservation);
  }

  @Query(() => String, { description: "« stripe » ou « simulated »." })
  paymentMode(): string {
    return paymentMode;
  }

  // --- Client connecté --------------------------------------------------------

  @Authorized()
  @Mutation(() => CheckoutResult)
  async createReservation(@Arg("data") data: CheckoutInput, @Ctx() ctx: Context): Promise<CheckoutResult> {
    const reservation = await createPendingReservation(
      ctx.user!.sub,
      data.startDate,
      data.endDate,
      data.items,
      data.billing,
    );

    try {
      const { url, sessionId } = await createPaymentSession(reservation);
      if (sessionId) {
        await AppDataSource.getRepository(Reservation).update(reservation.id, { stripeSessionId: sessionId });
      }
      return { reservationId: reservation.id, paymentUrl: url };
    } catch (error) {
      // Si le paiement ne peut pas être préparé, on libère immédiatement le matériel.
      await markCancelled(reservation.id);
      console.error("[paiement]", error);
      throw badInput("Le paiement n'a pas pu être préparé. Réessaie dans un instant.");
    }
  }

  @Authorized()
  @Mutation(() => Reservation, {
    description: "Confirme le paiement au retour de la page de paiement (idempotent).",
  })
  async confirmPayment(
    @Arg("id", () => ID) id: string,
    @Arg("sessionId", () => String, { nullable: true }) sessionId: string | null,
    @Ctx() ctx: Context,
  ): Promise<Reservation> {
    const reservation = await findReservation(id);
    if (!canSee(ctx, reservation)) throw notFound("Réservation");
    if (reservation.status !== ReservationStatus.PENDING) return reservation;
    if (isExpired(reservation)) throw badInput("Le délai de paiement est dépassé : refais ta réservation.");

    if (paymentMode === "stripe") {
      // On ne croit jamais le navigateur sur parole : Stripe confirme le paiement.
      if (!sessionId || !(await isStripeSessionPaid(sessionId, reservation.id))) {
        throw badInput("Paiement non confirmé par Stripe.");
      }
    }
    await markPaid(reservation.id);
    return findReservation(id);
  }

  @Authorized()
  @Query(() => [Reservation])
  myReservations(@Ctx() ctx: Context): Promise<Reservation[]> {
    return userReservations(ctx.user!.sub);
  }

  @Authorized()
  @Query(() => Reservation, { nullable: true })
  async reservation(@Arg("id", () => ID) id: string, @Ctx() ctx: Context): Promise<Reservation | null> {
    const reservation = await findReservation(id).catch(() => null);
    return reservation && canSee(ctx, reservation) ? reservation : null;
  }

  // --- Back-office ----------------------------------------------------------

  @Authorized(UserRole.ADMIN)
  @Query(() => [Reservation])
  adminReservations(): Promise<Reservation[]> {
    return allReservations();
  }
}
