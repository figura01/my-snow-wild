"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LOGIN = gql`
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      id
      role
    }
  }
`;

type LoginResult = { login: { id: string; role: "ADMIN" | "USER" } };

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [login, { loading }] = useMutation<LoginResult>(LOGIN);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const { data } = await login({
        variables: {
          data: { email: String(form.get("email")), password: String(form.get("password")) },
        },
      });
      router.push(next || (data?.login.role === "ADMIN" ? "/admin" : "/"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
