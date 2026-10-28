"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($data: ProfileInput!) {
    updateProfile(data: $data) { id firstName lastName phone address postalCode city }
  }
`;
const CHANGE_PASSWORD = gql`
  mutation ChangePassword($data: PasswordInput!) { changePassword(data: $data) }
`;

export type ProfileUser = {
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
};

export const PROFILE_FIELDS = [
  { name: "firstName", label: "Prénom", autoComplete: "given-name", required: true },
  { name: "lastName", label: "Nom", autoComplete: "family-name", required: true },
  { name: "phone", label: "Téléphone", autoComplete: "tel", type: "tel" },
  { name: "address", label: "Adresse", autoComplete: "street-address", wide: true },
  { name: "postalCode", label: "Code postal", autoComplete: "postal-code", inputMode: "numeric", pattern: "\\d{5}" },
  { name: "city", label: "Ville", autoComplete: "address-level2" },
] as const;

/** Les coordonnées suffisent-elles pour commander sans ressaisie ? */
export const isProfileComplete = (u: ProfileUser) => !!(u.firstName && u.lastName && u.phone && u.address && u.postalCode && u.city);

const card = "flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 sm:p-6";

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const [save, { loading }] = useMutation(UPDATE_PROFILE);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim() || null;
    try {
      await save({
        variables: {
          data: {
            firstName: value("firstName") ?? "",
            lastName: value("lastName") ?? "",
            phone: value("phone"),
            address: value("address"),
            postalCode: value("postalCode"),
            city: value("city"),
          },
        },
      });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
  }

  return (
    <form onSubmit={onSubmit} className={card}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">Coordonnées de facturation</h2>
        <p className="text-sm text-muted">Préremplies au moment de commander : vous n&apos;aurez plus à les saisir.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {PROFILE_FIELDS.map((f) => (
          <div key={f.name} className={`flex flex-col gap-2 ${"wide" in f ? "sm:col-span-2" : ""}`}>
            <Label htmlFor={`profile-${f.name}`}>{f.label}</Label>
            <Input
              id={`profile-${f.name}`}
              name={f.name}
              type={"type" in f ? f.type : "text"}
              autoComplete={f.autoComplete}
              inputMode={"inputMode" in f ? f.inputMode : undefined}
              pattern={"pattern" in f ? f.pattern : undefined}
              required={"required" in f}
              defaultValue={user[f.name] ?? ""}
            />
          </div>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent" disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</Button>
        {saved && (
          <span role="status" className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Profil enregistré
          </span>
        )}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [change, { loading }] = useMutation(CHANGE_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get("newPassword") !== form.get("confirm")) {
      setError("Les deux nouveaux mots de passe ne sont pas identiques.");
      return;
    }
    try {
      await change({
        variables: { data: { currentPassword: String(form.get("currentPassword")), newPassword: String(form.get("newPassword")) } },
      });
      formElement.reset();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Modification impossible.");
    }
  }

  return (
    <form onSubmit={onSubmit} className={card}>
      <h2 className="text-xl font-bold">Mot de passe</h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={loading}>{loading ? "Modification…" : "Changer le mot de passe"}</Button>
        {saved && <span role="status" className="text-sm text-green-700 dark:text-green-400">Mot de passe modifié</span>}
      </div>
    </form>
  );
}
