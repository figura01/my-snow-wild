"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const REQUEST_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [request, { loading }] = useMutation(REQUEST_RESET);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    try {
      await request({ variables: { email } });
      setSentTo(email);
    } catch {
      setError("La demande n'a pas pu être envoyée. Réessayez dans un instant.");
    }
  }

  // Même message que l'adresse corresponde à un compte ou non.
  if (sentTo) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <MailCheck className="h-8 w-8 text-glacier" aria-hidden="true" />
        <p>
          Si un compte existe pour <strong className="break-all">{sentTo}</strong>, un e-mail vient de lui être envoyé avec un lien
          pour choisir un nouveau mot de passe. Le lien est valable une heure.
        </p>
        <p className="text-sm text-muted">Pensez à regarder dans les courriers indésirables.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail du compte</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Envoi…" : "Recevoir un lien"}
      </Button>
    </form>
  );
}
