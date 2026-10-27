"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CREATE_CATEGORY, UPDATE_CATEGORY } from "@/lib/graphql/catalog";
import type { Category } from "@/lib/types";

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [save, { loading }] = useMutation(category ? UPDATE_CATEGORY : CREATE_CATEGORY);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const data = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? "") || null,
    };
    try {
      await save({ variables: category ? { id: category.id, data } : { data } });
      router.push("/admin/categories");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-5 rounded-3xl border border-line bg-white p-5 md:p-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" defaultValue={category?.name} required minLength={2} maxLength={60} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description (facultatif)</Label>
        <Textarea id="description" name="description" defaultValue={category?.description ?? ""} maxLength={500} />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div>
        <Button type="submit" variant="accent" disabled={loading}>
          {loading ? "Enregistrement…" : category ? "Enregistrer" : "Créer la catégorie"}
        </Button>
      </div>
    </form>
  );
}
