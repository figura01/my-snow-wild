"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import { UPDATE_USER_ROLE } from "@/lib/graphql/catalog";

export function RoleSelect({ id, role, label }: { id: string; role: "ADMIN" | "USER"; label: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [update, { loading }] = useMutation(UPDATE_USER_ROLE);

  return (
    <span className="inline-flex flex-col gap-1">
      <Select
        aria-label={`Rôle de ${label}`}
        className="h-9 w-32"
        defaultValue={role}
        disabled={loading}
        onChange={async (e) => {
          setError(null);
          const next = e.target.value;
          try {
            await update({ variables: { id, role: next } });
            router.refresh();
          } catch (err) {
            e.target.value = role;
            setError(err instanceof Error ? err.message : "Modification impossible.");
          }
        }}
      >
        <option value="USER">Client</option>
        <option value="ADMIN">Admin</option>
      </Select>
      {error && <span role="alert" className="max-w-xs text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  );
}
