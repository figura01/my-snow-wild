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
  Int,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import type { Context } from "../auth/context";
import { AppDataSource } from "../data-source";
import { Invoice } from "../entities/Invoice";
import { Reservation, ReservationStatus } from "../entities/Reservation";
import { UserRole } from "../entities/User";
import { env } from "../config/env";
import { createPaymentIntent, isStripeSessionPaid, paymentMode, retrievePaymentIntent } from "../services/payment";
import { findInvoiceOf } from "../services/invoices";
import { MAX_LINES } from "../services/quote";
import {
  allReservations,
  createPendingReservation,
  findReservation,
  isExpired,
  markCancelled,
  markPaid,
  settleSucceededPayment,
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
  @Field({ description: "« stripe » : formulaire de carte intégré ; « simulated » : page de paiement simulé." })
  mode: string;
  @Field(() => String, { nullable: true, description: "Paiement simulé : page vers laquelle rediriger." })
  paymentUrl: string | null;
}

@ObjectType()
class PaymentDetails {
  @Field(() => ID) reservationId: string;
  @Field(() => Int) amountCents: number;
  @Field(() => Date, { nullable: true, description: "Fin du délai de paiement." }) expiresAt: Date | null;
  @Field({ description: "Secret du paiement Stripe, pour le formulaire de carte de CETTE réservation." })
  clientSecret: string;
}

@ObjectType()
class PaymentConfig {
  @Field() mode: string;
  @Field(() => String, { nullable: true, description: "Clé publiable Stripe (pk_…), publique par nature." })
  publishableKey: string | null;
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

  @FieldResolver(() => Invoice, {
    nullable: true,
    description: "Facture émise au paiement ; PDF : GET /api/reservations/:id/invoice.",
  })
  invoice(@Root() reservation: Reservation): Promise<Invoice | null> {
    if (reservation.status !== ReservationStatus.PAID) return Promise.resolve(null);
    return findInvoiceOf(reservation.id);
  }

  @Query(() => String, { description: "« stripe » ou « simulated »." })
  paymentMode(): string {
    return paymentMode;
  }

  @Query(() => PaymentConfig, { description: "Configuration du paiement côté navigateur." })
  paymentConfig(): PaymentConfig {
    return { mode: paymentMode, publishableKey: paymentMode === "stripe" ? env.stripe.publishableKey : null };
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

    if (paymentMode === "simulated") {
      return {
        reservationId: reservation.id,
        mode: paymentMode,
        paymentUrl: `${env.frontendUrl}/commande/paiement-simule?id=${reservation.id}`,
      };
    }
    try {
      const intent = await createPaymentIntent(reservation);
      await AppDataSource.getRepository(Reservation).update(reservation.id, { stripePaymentIntentId: intent.id });
      return { reservationId: reservation.id, mode: paymentMode, paymentUrl: null };
    } catch (error) {
      // Si le paiement ne peut pas être préparé, on libère immédiatement le matériel.
      await markCancelled(reservation.id);
      console.error("[paiement]", error);
      throw badInput("Le paiement n'a pas pu être préparé. Réessaie dans un instant.");
    }
  }

  @Authorized()
  @Query(() => PaymentDetails, {
    description: "Paiement d'une réservation en attente (formulaire de carte) ; aussi après un rechargement de la page.",
  })
  async reservationPayment(@Arg("id", () => ID) id: string, @Ctx() ctx: Context): Promise<PaymentDetails> {
    const reservation = await findReservation(id);
    if (reservation.user?.id !== ctx.user!.sub) throw notFound("Réservation");
    if (reservation.status === ReservationStatus.PAID) throw badInput("Cette réservation est déjà payée.");
    if (reservation.status !== ReservationStatus.PENDING || isExpired(reservation)) {
      throw badInput("Le délai de paiement est dépassé : refais ta réservation.");
    }
    const intent = reservation.stripePaymentIntentId ? await retrievePaymentIntent(reservation.stripePaymentIntentId) : null;
    if (!intent?.client_secret) throw badInput("Paiement indisponible pour cette réservation.");
    return { reservationId: id, amountCents: reservation.totalCents, expiresAt: reservation.expiresAt, clientSecret: intent.client_secret };
  }

  @Authorized()
  @Mutation(() => Reservation, {
    description: "Vérifie le paiement au retour du formulaire (idempotent). Stripe fait foi, jamais le navigateur.",
  })
  async confirmPayment(
    @Arg("id", () => ID) id: string,
    @Arg("sessionId", () => String, { nullable: true }) sessionId: string | null,
    @Ctx() ctx: Context,
  ): Promise<Reservation> {
    const reservation = await findReservation(id);
    if (!canSee(ctx, reservation)) throw notFound("Réservation");
    if (reservation.status === ReservationStatus.PAID) return reservation;

    if (paymentMode === "simulated") {
      if (reservation.status !== ReservationStatus.PENDING || isExpired(reservation)) {
        throw badInput("Le délai de paiement est dépassé : refais ta réservation.");
      }
      await markPaid(reservation.id);
      return findReservation(id);
    }

    if (reservation.stripePaymentIntentId) {
      const intent = await retrievePaymentIntent(reservation.stripePaymentIntentId);
      if (intent?.status === "succeeded") {
        const outcome = await settleSucceededPayment(id, intent);
        if (outcome === "refunded") {
          throw badInput("Le délai de paiement était dépassé et le matériel n'est plus disponible : vous avez été remboursé.");
        }
        return findReservation(id);
      }
      if (intent?.status === "processing") return reservation; // confirmation à venir par le webhook
      throw badInput("Paiement non confirmé par Stripe.");
    }

    // Ancien parcours : page Stripe Checkout.
    if (reservation.status !== ReservationStatus.PENDING || isExpired(reservation)) {
      throw badInput("Le délai de paiement est dépassé : refais ta réservation.");
    }
    if (!sessionId || !(await isStripeSessionPaid(sessionId, reservation.id))) {
      throw badInput("Paiement non confirmé par Stripe.");
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
  @Query(() => [Reservation], { description: "Réservations, filtrables par statut (paniers exclus par défaut)." })
  adminReservations(
    @Arg("statuses", () => [ReservationStatus], { nullable: true }) statuses: ReservationStatus[] | null,
  ): Promise<Reservation[]> {
    return allReservations(statuses ?? undefined);
  }
}
