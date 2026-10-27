import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/session";
import Link from "next/link";
import { safeNext } from "@/lib/safeNext";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNext((await searchParams).next, "");
  const user = await getSessionUser();
  if (user) redirect(next || (user.role === "ADMIN" ? "/admin" : "/"));

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-line bg-white p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-bold">Connexion</h1>
      <LoginForm next={next} />
      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-glacier hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
