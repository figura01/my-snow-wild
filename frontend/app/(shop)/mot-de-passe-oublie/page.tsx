import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <h1 className="mb-2 text-2xl font-bold">Mot de passe oublié</h1>
      <p className="mb-6 text-sm text-muted">Indiquez l&apos;adresse de votre compte : nous vous envoyons un lien pour en choisir un nouveau.</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-glacier hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
