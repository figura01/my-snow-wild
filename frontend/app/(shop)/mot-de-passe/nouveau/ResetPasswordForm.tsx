"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RESET_PASSWORD = gql`
  mutation ResetPassword($data: ResetPasswordInput!) {
    resetPassword(data: $data) {
      id
      role
    }
  }
`;

type Result = { resetPassword: { id: string; role: "ADMIN" | "USER" } };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [reset, { loading }] = useMutation<Result>(RESET_PASSWORD);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword !== String(form.get("confirm"))) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    try {
      const { data } = await reset({ variables: { data: { token, newPassword } } });
      // Le client est connecté : direction son compte (ou le back-office).
      router.replace(data?.resetPassword.role === "ADMIN" ? "/admin" : "/compte");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Changement impossible.";
      setExpired(/plus valable/.test(message));
      setError(message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
        <span className="text-xs text-muted">8 caractères au minimum.</span>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Confirmation</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}{" "}
          {expired && (
            <Link href="/mot-de-passe-oublie" className="font-semibold underline">
              Recevoir un nouveau lien
            </Link>
          )}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer et me connecter"}
      </Button>
    </form>
  );
}
