import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { todayIso, type CatalogParams } from "@/lib/catalog";
import { cn } from "@/lib/utils";

// Formulaire GET classique : fonctionne sans JavaScript et l'URL de recherche
// est partageable (ex. /catalogue?q=ski&du=2026-12-20&au=2026-12-26).
export function SearchForm({
  categories,
  params = {},
}: {
  categories: { slug: string; name: string }[];
  params?: CatalogParams;
}) {
  const today = todayIso();
  return (
    <form
      action="/catalogue"
      method="get"
      className="grid gap-3 rounded-3xl border border-line bg-white p-4 shadow-sm md:grid-cols-[2fr_1.3fr_1fr_1fr_auto] md:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="q">Que cherchez-vous ?</Label>
        <Input id="q" name="q" placeholder="Ski, casque, chaussures…" defaultValue={params.q} maxLength={100} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categorie">Catégorie</Label>
        <Select id="categorie" name="categorie" defaultValue={params.categorie ?? ""}>
          <option value="">Toutes</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="du">Du</Label>
        <Input id="du" name="du" type="date" min={today} defaultValue={params.du} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="au">Au</Label>
        <Input id="au" name="au" type="date" min={today} defaultValue={params.au} />
      </div>
      <button type="submit" className={cn(buttonVariants({ variant: "accent" }), "md:h-11")}>
        <Search className="h-4 w-4" />
        Rechercher
      </button>
    </form>
  );
}
