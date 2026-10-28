import { Arg, Authorized, Field, ID, Int, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { CustomerSource } from "../entities/Customer";
import { ReservationStatus } from "../entities/Reservation";
import { UserRole } from "../entities/User";
import {
  customerImportTemplate,
  exportCustomers,
  listCustomers,
  planCustomerImport,
  runCustomerImport,
} from "../services/customers";
import { exportReservations } from "../services/reservation-export";

@ObjectType()
class AdminCustomer {
  @Field(() => ID) id: string;
  @Field() email: string;
  @Field() firstName: string;
  @Field() lastName: string;
  @Field(() => String, { nullable: true }) phone: string | null;
  @Field(() => String, { nullable: true }) address: string | null;
  @Field(() => String, { nullable: true }) postalCode: string | null;
  @Field(() => String, { nullable: true }) city: string | null;
  @Field(() => CustomerSource) source: CustomerSource;
  @Field() createdAt: Date;
  @Field({ description: "La fiche est rattachée à un compte (client inscrit)." }) hasAccount: boolean;
  @Field(() => Int) reservationCount: number;
  @Field(() => Int, { description: "Total des réservations payées, en centimes." }) paidCents: number;
}

@ObjectType()
class CustomerIssueType {
  @Field(() => Int, { description: "Numéro de ligne dans le fichier (1 = en-têtes)." }) line: number;
  @Field() message: string;
}

@ObjectType()
class CustomerPreviewRow {
  @Field(() => Int) line: number;
  @Field() email: string;
  @Field() firstName: string;
  @Field() lastName: string;
  @Field(() => String, { nullable: true }) city: string | null;
  @Field({ description: "« create », « update » ou « skip »." }) action: string;
}

@ObjectType()
class CustomerImportPreview {
  @Field(() => Int) rows: number;
  @Field() valid: boolean;
  @Field(() => [CustomerPreviewRow]) customers: CustomerPreviewRow[];
  @Field(() => [CustomerIssueType]) errors: CustomerIssueType[];
  @Field(() => [CustomerIssueType]) warnings: CustomerIssueType[];
}

@ObjectType()
class CustomerImportResultType {
  @Field(() => Int) created: number;
  @Field(() => Int) updated: number;
  @Field(() => Int) skipped: number;
}

// Back-office : fiches clients, import / export, et export des réservations.
@Resolver()
export class CustomerResolver {
  @Authorized(UserRole.ADMIN)
  @Query(() => [AdminCustomer], { description: "Fiches clients, avec ou sans compte." })
  adminCustomers(): Promise<AdminCustomer[]> {
    return listCustomers();
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => CustomerImportPreview, { description: "Analyse un fichier clients sans rien enregistrer." })
  async previewCustomerImport(@Arg("csv") csv: string): Promise<CustomerImportPreview> {
    const plan = await planCustomerImport(csv);
    return {
      rows: plan.rows,
      valid: plan.errors.length === 0,
      errors: plan.errors,
      warnings: plan.warnings,
      customers: plan.customers.map((c) => ({
        line: c.line, email: c.email, firstName: c.firstName, lastName: c.lastName, city: c.city, action: c.action,
      })),
    };
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => CustomerImportResultType, { description: "Importe un fichier clients (tout ou rien)." })
  importCustomers(@Arg("csv") csv: string): Promise<CustomerImportResultType> {
    return runCustomerImport(csv);
  }

  @Authorized(UserRole.ADMIN)
  @Query(() => String, { description: "Fiches clients au format CSV (sans aucune donnée de connexion)." })
  exportCustomersCsv(): Promise<string> {
    return exportCustomers();
  }

  @Authorized(UserRole.ADMIN)
  @Query(() => String, { description: "Modèle CSV d'import de clients." })
  customerImportTemplate(): string {
    return customerImportTemplate();
  }

  @Authorized(UserRole.ADMIN)
  @Query(() => String, { description: "Réservations au format CSV, filtrables par statut." })
  exportReservationsCsv(
    @Arg("statuses", () => [ReservationStatus], { nullable: true }) statuses: ReservationStatus[] | null,
  ): Promise<string> {
    return exportReservations(statuses ?? undefined);
  }
}
