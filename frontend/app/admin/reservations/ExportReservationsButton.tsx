"use client";

import { useApolloClient } from "@apollo/client/react";
import { Download } from "lucide-react";
import { useState } from "react";
import { downloadCsv, today } from "@/components/admin/csv";
import { Button } from "@/components/ui/button";
import { EXPORT_RESERVATIONS } from "@/lib/graphql/customers";
import type { ReservationStatus } from "@/lib/reservations";

// Exporte les réservations de l'onglet affiché (même filtre de statut).
export function ExportReservationsButton({ statuses, tab }: { statuses: ReservationStatus[] | null; tab: string }) {
  const client = useApolloClient();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function run() {
    setState("loading");
    try {
      const { data } = await client.query<{ exportReservationsCsv: string }>({
        query: EXPORT_RESERVATIONS,
        variables: { statuses },
        fetchPolicy: "network-only",
      });
      downloadCsv(data!.exportReservationsCsv, `snow-wild-reservations-${tab}-${today()}.csv`);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {state === "error" && <span role="alert" className="text-sm text-red-600 dark:text-red-400">Export impossible.</span>}
      <Button type="button" variant="outline" size="sm" disabled={state === "loading"} onClick={run}>
        <Download className="h-4 w-4" aria-hidden="true" /> {state === "loading" ? "Export…" : "Exporter (CSV)"}
      </Button>
    </div>
  );
}
