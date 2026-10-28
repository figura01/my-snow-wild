import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReservationSummary } from "@/components/checkout/ReservationSummary";
import { buttonVariants } from "@/components/ui/button";
import { RESERVATION_FIELDS, type Reservation } from "@/lib/reservations";
import { serverGraphql } from "@/lib/server/graphql";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/compte");

  const { myReservations } = await serverGraphql<{ myReservations: Reservation[] }>(
    `{ myReservations { ${RESERVATION_FIELDS} } }`,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Mon compte</h1>
          <p className="text-muted">
            {user.firstName} {user.lastName} · {user.email}
          </p>
        </div>
        <Link href="/compte/profil" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Mon profil et mes coordonnées
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Mes réservations</h2>
        {myReservations.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-line bg-surface p-8">
            <p className="text-muted">Vous n&apos;avez pas encore de réservation.</p>
            <Link href="/catalogue" className={buttonVariants({ variant: "accent" })}>Parcourir le catalogue</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myReservations.map((reservation) => (
              <ReservationSummary key={reservation.id} reservation={reservation} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
