"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { newRow, SizesEditor, type SizeRow } from "./SizesEditor";
import { CREATE_MATERIAL, UPDATE_MATERIAL } from "@/lib/graphql/catalog";
import type { Category, Material } from "@/lib/types";

export function MaterialForm({
  material,
  categories,
}: {
  material?: Material;
  categories: Pick<Category, "id" | "name">[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sizes, setSizes] = useState<SizeRow[]>(() =>
    material?.variants.length
      ? material.variants.map((v) => ({ key: v.id, id: v.id, size: v.size, stock: v.stock }))
      : [newRow("Taille unique", 1)],
  );
  const [save, { loading }] = useMutation(material ? UPDATE_MATERIAL : CREATE_MATERIAL);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    // Le prix est saisi en euros et envoyé en centimes (entier).
    const price = Number(String(form.get("price") ?? "0").replace(",", "."));
    const data = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? "") || null,
      imageUrl: String(form.get("imageUrl") ?? "") || null,
      dailyPriceCents: Math.round(price * 100),
      variants: sizes.map((row) => ({ id: row.id ?? null, size: row.size, stock: row.stock })),
      isActive: form.get("isActive") === "on",
      categoryId: String(form.get("categoryId") ?? ""),
    };
    try {
      await save({ variables: material ? { id: material.id, data } : { data } });
      router.push("/admin/materials");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
  }

  if (categories.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-white p-6 text-muted">
        Crée d&apos;abord une catégorie avant d&apos;ajouter un matériel.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5 rounded-3xl border border-line bg-white p-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nom de la référence</Label>
        <Input id="name" name="name" defaultValue={material?.name} required minLength={2} maxLength={120} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="categoryId">Catégorie</Label>
          <Select id="categoryId" name="categoryId" defaultValue={material?.category.id} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Prix / jour (€)</Label>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            pattern="[0-9]+([.,][0-9]{1,2})?"
            title="Montant en euros, par exemple 12 ou 12,50"
            placeholder="12,50"
            defaultValue={material ? (material.dailyPriceCents / 100).toFixed(2).replace(".", ",") : ""}
            required
          />
        </div>
      </div>
      <SizesEditor rows={sizes} onChange={setSizes} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description (facultatif)</Label>
        <Textarea id="description" name="description" defaultValue={material?.description ?? ""} maxLength={2000} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="imageUrl">URL de l&apos;image (facultatif)</Label>
        <Input id="imageUrl" name="imageUrl" type="url" defaultValue={material?.imageUrl ?? ""} />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={material?.isActive ?? true} className="h-4 w-4" />
        Visible dans le catalogue
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div>
        <Button type="submit" variant="accent" disabled={loading}>
          {loading ? "Enregistrement…" : material ? "Enregistrer" : "Créer le matériel"}
        </Button>
      </div>
    </form>
  );
}
