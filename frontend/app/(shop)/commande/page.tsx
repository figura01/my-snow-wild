import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Commande" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Commander demande un compte : la réservation est rattachée au client.
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/commande");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-extrabold tracking-tight">Commande</h1>
      <CheckoutForm user={{ firstName: user.firstName, lastName: user.lastName, email: user.email }} />
    </div>
  );
}
