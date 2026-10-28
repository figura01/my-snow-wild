import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./ResetPasswordForm";

// Le lien contient un jeton secret : la page ne le transmet à aucun autre site (pas de Referer)
// et n'est pas indexée.
export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-bold">Nouveau mot de passe</h1>
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-4">
          <p>Ce lien est incomplet ou n&apos;est plus valable.</p>
          <Link href="/mot-de-passe-oublie" className="font-semibold text-glacier hover:underline">
            Recevoir un nouveau lien
          </Link>
        </div>
      )}
    </div>
  );
}
