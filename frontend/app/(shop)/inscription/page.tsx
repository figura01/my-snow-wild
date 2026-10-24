import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/session";
import { safeNext } from "@/lib/safeNext";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNext((await searchParams).next, "/");
  if (await getSessionUser()) redirect(next);

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-line bg-white p-8">
      <h1 className="mb-6 text-2xl font-bold">Créer un compte</h1>
      <RegisterForm next={next} />
      <p className="mt-6 text-center text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-glacier hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
