import { IsInt, IsOptional, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import type { Context } from "../auth/context";
import { Maintenance } from "../entities/Maintenance";
import { Material } from "../entities/Material";
import { MaterialVariant } from "../entities/MaterialVariant";
import { Reservation } from "../entities/Reservation";
import { UserRole } from "../entities/User";
import {
  endMaintenance,
  findConflicts,
  listMaintenances,
  maintenanceLoader,
  startMaintenance,
} from "../services/maintenance";

@InputType()
class MaintenanceInput {
  @Field(() => ID)
  @IsUUID("4")
  variantId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1, { message: "Au moins 1 exemplaire." })
  @Max(500)
  quantity: number;

  @Field()
  @MinLength(2, { message: "Indique le motif de la maintenance." })
  @MaxLength(200)
  reason: string;

  @Field(() => String, { nullable: true, description: "AAAA-MM-JJ, facultatif" })
  @IsOptional()
  @MaxLength(10)
  expectedReturnDate?: string | null;
}

@ObjectType({ description: "Réservation à venir qui n'a plus assez d'exemplaires en service." })
class MaintenanceConflict {
  @Field(() => Reservation) reservation: Reservation;
  @Field(() => MaterialVariant) variant: MaterialVariant;
  @Field() materialName: string;
  @Field() size: string;
  @Field(() => Int, { description: "Exemplaires réservés sur la période." }) reserved: number;
  @Field(() => Int, { description: "Exemplaires en service." }) inService: number;
}

@ObjectType()
class MaintenanceResult {
  @Field(() => Maintenance) maintenance: Maintenance;
  @Field(() => [MaintenanceConflict], { description: "Réservations touchées par cette maintenance." })
  conflicts: MaintenanceConflict[];
}

@Resolver(() => Maintenance)
export class MaintenanceResolver {
  @FieldResolver(() => Material)
  material(@Root() maintenance: Maintenance): Material {
    return maintenance.variant.material;
  }

  @FieldResolver(() => Boolean)
  isActive(@Root() maintenance: Maintenance): boolean {
    return maintenance.endedAt === null;
  }

  @Authorized(UserRole.ADMIN)
  @Query(() => [Maintenance], { description: "Maintenances (en cours uniquement par défaut)." })
  adminMaintenances(
    @Arg("activeOnly", () => Boolean, { defaultValue: true }) activeOnly: boolean,
    @Arg("materialId", () => ID, { nullable: true }) materialId: string | null,
  ): Promise<Maintenance[]> {
    return listMaintenances({ activeOnly, materialId: materialId ?? undefined });
  }

  @Authorized(UserRole.ADMIN)
  @Query(() => [MaintenanceConflict])
  maintenanceConflicts(): Promise<MaintenanceConflict[]> {
    return findConflicts();
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => MaintenanceResult)
  async startMaintenance(@Arg("data") data: MaintenanceInput): Promise<MaintenanceResult> {
    const maintenance = await startMaintenance(data);
    return { maintenance, conflicts: await findConflicts([data.variantId]) };
  }

  @Authorized(UserRole.ADMIN)
  @Mutation(() => Maintenance, { description: "Remet les exemplaires en service (idempotent)." })
  endMaintenance(@Arg("id", () => ID) id: string): Promise<Maintenance> {
    return endMaintenance(id);
  }
}

// Champs calculés des tailles : exemplaires en maintenance et en service.
@Resolver(() => MaterialVariant)
export class VariantResolver {
  @FieldResolver(() => Int, { description: "Exemplaires actuellement en maintenance." })
  inMaintenance(@Root() variant: MaterialVariant, @Ctx() ctx: Context): Promise<number> {
    return maintenanceLoader(ctx)(variant.id);
  }

  @FieldResolver(() => Int, { description: "Exemplaires louables (stock − maintenance)." })
  async inService(@Root() variant: MaterialVariant, @Ctx() ctx: Context): Promise<number> {
    return Math.max(0, variant.stock - (await maintenanceLoader(ctx)(variant.id)));
  }
}
