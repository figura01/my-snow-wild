import { Arg, Authorized, Field, Float, Int, ObjectType, Query, Resolver } from "type-graphql";
import { UserRole } from "../entities/User";
import { buildDashboard } from "../services/analytics";

@ObjectType()
class SeasonType {
  @Field(() => Int) startYear: number;
  @Field({ description: "« 2026-2027 »" }) label: string;
  @Field({ description: "Premier jour (AAAA-MM-JJ)." }) start: string;
  @Field({ description: "Dernier jour (AAAA-MM-JJ)." }) end: string;
}

@ObjectType()
class KpisType {
  @Field(() => Float, { description: "Chiffre d'affaires TTC encaissé, en centimes." }) revenueCents: number;
  @Field(() => Int) paidCount: number;
  @Field(() => Int) averageBasketCents: number;
  @Field(() => Float, { description: "Part de la capacité de la saison déjà réservée (0 → 1)." }) fillRate: number;
}

@ObjectType()
class WeekPointType {
  @Field(() => Int) week: number;
  @Field() weekStart: string;
  @Field(() => Float, { nullable: true, description: "CA cumulé de la saison, en centimes (null après la date du jour)." })
  current: number | null;
  @Field(() => Float, { nullable: true, description: "CA cumulé de la saison précédente à la même semaine." })
  previous: number | null;
}

@ObjectType()
class MaterialStatType {
  @Field() id: string;
  @Field() name: string;
  @Field() category: string;
  @Field(() => Int, { description: "Exemplaires × jours loués." }) rentalDays: number;
  @Field(() => Float) revenueCents: number;
}

@ObjectType()
class CategoryStatType {
  @Field() name: string;
  @Field(() => Int) rentalDays: number;
  @Field(() => Float) revenueCents: number;
}

@ObjectType()
class OutcomesType {
  @Field(() => Int) paid: number;
  @Field(() => Int) pending: number;
  @Field(() => Int) expired: number;
  @Field(() => Int) cancelled: number;
}

@ObjectType()
class DashboardType {
  @Field(() => SeasonType) season: SeasonType;
  @Field(() => SeasonType) previousSeason: SeasonType;
  @Field({ description: "Dernier jour pris en compte (aujourd'hui pour la saison en cours)." }) asOf: string;
  @Field({ description: "Même date, saison précédente." }) previousAsOf: string;
  @Field() isCurrent: boolean;
  @Field(() => [SeasonType]) seasons: SeasonType[];
  @Field(() => KpisType) current: KpisType;
  @Field(() => KpisType) previous: KpisType;
  @Field(() => [WeekPointType]) weeks: WeekPointType[];
  @Field(() => [MaterialStatType]) materials: MaterialStatType[];
  @Field(() => [CategoryStatType]) categories: CategoryStatType[];
  @Field(() => OutcomesType) outcomes: OutcomesType;
  @Field(() => Int, { description: "Réservations fictives (seed:history) incluses dans les chiffres." }) demoReservations: number;
}

@Resolver()
export class DashboardResolver {
  @Authorized(UserRole.ADMIN)
  @Query(() => DashboardType, { description: "Indicateurs d'une saison (par défaut la saison en cours), comparés à la précédente." })
  adminDashboard(@Arg("season", () => Int, { nullable: true }) season: number | null): Promise<DashboardType> {
    return buildDashboard(season);
  }
}
