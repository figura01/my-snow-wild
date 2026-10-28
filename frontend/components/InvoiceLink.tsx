import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const invoiceUrl = (reservationId: string, download = false) =>
  `/api/reservations/${reservationId}/invoice${download ? "?download=1" : ""}`;

type Props = { reservationId: string; number?: string | null; className?: string };

// Lien vers la facture PDF d'une réservation payée. Ouvert dans un nouvel onglet :
// le navigateur l'affiche, et l'utilisateur peut l'enregistrer ou l'imprimer.
export function InvoiceLink({ reservationId, number, className }: Props) {
  return (
    <a
      href={invoiceUrl(reservationId)}
      target="_blank"
      rel="noopener"
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-brand hover:underline", className)}
    >
      <FileText className="h-4 w-4" aria-hidden="true" />
      {number ? `Facture ${number}` : "Facture (PDF)"}
    </a>
  );
}
