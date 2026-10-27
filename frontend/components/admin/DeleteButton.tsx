"use client";

import { useMutation } from "@apollo/client/react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DELETE_CATEGORY, DELETE_MATERIAL, DELETE_USER } from "@/lib/graphql/catalog";

const MUTATIONS = {
  category: DELETE_CATEGORY,
  material: DELETE_MATERIAL,
  user: DELETE_USER,
};

// Bouton de suppression générique : confirmation, mutation, puis rafraîchissement
// de la page serveur. Affiche le message d'erreur de l'API si elle refuse.
export function DeleteButton({
  kind,
  id,
  label,
  redirectTo,
}: {
  kind: keyof typeof MUTATIONS;
  id: string;
  label: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [remove, { loading }] = useMutation(MUTATIONS[kind]);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-red-600 dark:text-red-400"
        disabled={loading}
        aria-label={`Supprimer ${label}`}
        onClick={async () => {
          if (!window.confirm(`Supprimer « ${label} » ? Cette action est définitive.`)) return;
          setError(null);
          try {
            await remove({ variables: { id } });
            if (redirectTo) router.push(redirectTo);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Suppression impossible.");
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
        Supprimer
      </Button>
      {error && (
        <span role="alert" className="max-w-xs text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </span>
  );
}
