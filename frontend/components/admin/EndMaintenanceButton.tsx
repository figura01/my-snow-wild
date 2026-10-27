"use client";

import { useMutation } from "@apollo/client/react";
import { Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { END_MAINTENANCE } from "@/lib/graphql/catalog";

export function EndMaintenanceButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [end, { loading }] = useMutation(END_MAINTENANCE);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        className="whitespace-nowrap"
        aria-label={`Remettre en service : ${label}`}
        onClick={async () => {
          setError(null);
          try {
            await end({ variables: { id } });
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Opération impossible.");
          }
        }}
      >
        <Wrench className="h-4 w-4" aria-hidden="true" />
        Remettre en service
      </Button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
