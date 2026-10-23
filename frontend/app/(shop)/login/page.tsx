import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/");

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-line bg-white p-8">
      <h1 className="mb-6 text-2xl font-bold">Connexion</h1>
      <LoginForm />
    </div>
  );
}
