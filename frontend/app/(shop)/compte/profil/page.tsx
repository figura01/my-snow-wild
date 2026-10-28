import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordForm, ProfileForm } from "@/components/account/ProfileForms";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/compte/profil");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link href="/compte" className="text-sm text-muted hover:text-ink">← Mon compte</Link>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Mon profil</h1>
        <p className="text-muted">{user.email}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <ProfileForm user={user} />
        <PasswordForm />
      </div>
    </div>
  );
}
