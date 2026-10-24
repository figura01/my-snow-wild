import type { Metadata } from "next";
import { ConfirmationView } from "./ConfirmationView";

export const metadata: Metadata = { title: "Confirmation" };
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <ConfirmationView
      reservationId={String(params.id ?? "")}
      sessionId={typeof params.session_id === "string" ? params.session_id : null}
    />
  );
}
