"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { AlertTriangle, CheckCircle2, Download, FileUp, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { EXPORT_CATALOG, IMPORT_CATALOG, IMPORT_TEMPLATE, PREVIEW_CATALOG_IMPORT } from "@/lib/graphql/catalog";
import { t } from "./table";

type Issue = { line: number; message: string };
type Preview = {
  rows: number;
  valid: boolean;
  materials: {
    name: string;
    action: "create" | "update";
    category: string;
    categoryCreated: boolean;
    dailyPriceCents: number;
    sizes: string[];
    totalStock: number;
    images: number;
  }[];
  errors: Issue[];
  warnings: Issue[];
};
type Result = { created: number; updated: number; categoriesCreated: number; imagesAdded: number; warnings: Issue[] };

const MAX_BYTES = 500_000;

function download(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

// Import du catalogue : choix du fichier → aperçu et erreurs → import ; plus l'export et le modèle.
export function ImportPanel() {
  const router = useRouter();
  const client = useApolloClient();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; csv: string } | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runPreview, { loading: analysing }] = useMutation<{ previewCatalogImport: Preview }>(PREVIEW_CATALOG_IMPORT);
  const [runImport, { loading: importing }] = useMutation<{ importCatalog: Result }>(IMPORT_CATALOG);

  async function exportFile(kind: "catalogue" | "modele") {
    setError(null);
    try {
      if (kind === "catalogue") {
        const { data } = await client.query<{ exportCatalogCsv: string }>({ query: EXPORT_CATALOG, fetchPolicy: "network-only" });
        download(data!.exportCatalogCsv, `snow-wild-catalogue-${today()}.csv`);
      } else {
        const { data } = await client.query<{ catalogImportTemplate: string }>({ query: IMPORT_TEMPLATE });
        download(data!.catalogImportTemplate, "snow-wild-modele-import.csv");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Téléchargement impossible.");
    }
  }

  async function choose(selected: File) {
    setError(null);
    setPreview(null);
    setResult(null);
    if (selected.size > MAX_BYTES) {
      setError("Fichier trop volumineux (500 Ko au maximum).");
      return;
    }
    const csv = await selected.text();
    if (csv.includes("�")) {
      setError("Les accents du fichier sont illisibles : dans Excel, enregistrez-le au format « CSV UTF-8 ».");
      return;
    }
    setFile({ name: selected.name, csv });
    try {
      const { data } = await runPreview({ variables: { csv } });
      setPreview(data!.previewCatalogImport);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse impossible.");
    }
  }

  async function confirm() {
    if (!file) return;
    setError(null);
    try {
      const { data } = await runImport({ variables: { csv: file.csv } });
      setResult(data!.importCatalog);
      setPreview(null);
      setFile(null);
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible.");
    }
  }

  const created = preview?.materials.filter((m) => m.action === "create").length ?? 0;
  const updated = (preview?.materials.length ?? 0) - created;
  const newCategories = new Set(preview?.materials.filter((m) => m.categoryCreated).map((m) => m.category.toLowerCase())).size;

  return (
    <div className="flex flex-col gap-6">
      {/* Export et modèle */}
      <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Exporter</h2>
          <p className="text-sm text-muted">
            Le catalogue complet au format d&apos;import : modifiez-le dans un tableur puis réimportez-le pour mettre à jour prix, stocks et descriptions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => exportFile("catalogue")}>
            <Download className="h-4 w-4" aria-hidden="true" /> Exporter le catalogue
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => exportFile("modele")}>
            <Download className="h-4 w-4" aria-hidden="true" /> Modèle vide avec exemples
          </Button>
        </div>
      </section>

      {/* Import */}
      <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Importer</h2>
          <p className="text-sm text-muted">
            Fichier CSV (séparateur « ; » ou « , »), une ligne par taille. Un matériel au nom déjà connu est mis à jour ; ses
            tailles absentes du fichier sont conservées. Rien n&apos;est enregistré avant votre confirmation.
          </p>
        </div>

        <input
          ref={input}
          id="csv-input"
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && choose(e.target.files[0])}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="accent" size="sm" disabled={analysing || importing} onClick={() => input.current?.click()}>
            <FileUp className="h-4 w-4" aria-hidden="true" /> {analysing ? "Analyse…" : "Choisir un fichier CSV"}
          </Button>
          {file && <span className="text-sm text-muted">{file.name}</span>}
        </div>

        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {preview && (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              <strong>{preview.rows}</strong> ligne{preview.rows > 1 ? "s" : ""} : <strong>{created}</strong> matériel{created > 1 ? "s" : ""} à créer,{" "}
              <strong>{updated}</strong> à mettre à jour{newCategories > 0 && <>, <strong>{newCategories}</strong> catégorie{newCategories > 1 ? "s" : ""} à créer</>}.
            </p>

            {preview.errors.length > 0 && (
              <IssueList
                tone="error"
                title={`${preview.errors.length} erreur${preview.errors.length > 1 ? "s" : ""} à corriger dans le fichier`}
                issues={preview.errors}
              />
            )}
            {preview.warnings.length > 0 && <IssueList tone="warning" title="À savoir" issues={preview.warnings} />}

            {preview.materials.length > 0 && (
              <div className={t.wrap}>
                <table className={t.table}>
                  <thead className={t.thead}>
                    <tr>
                      <th className={t.th}>Matériel</th>
                      <th className={t.th}>Action</th>
                      <th className={t.th}>Catégorie</th>
                      <th className={t.th}>Prix / jour</th>
                      <th className={t.th}>Tailles</th>
                      <th className={t.th}>Photos</th>
                    </tr>
                  </thead>
                  <tbody className={t.tbody}>
                    {preview.materials.map((m) => (
                      <tr key={m.name} className={t.tr}>
                        <td className={t.title}>{m.name}</td>
                        <td data-label="Action" className={t.td}>
                          <span
                            className={
                              m.action === "create"
                                ? "rounded-full bg-green-100 dark:bg-green-400/15 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300"
                                : "rounded-full bg-sky-50 dark:bg-glacier/15 px-2.5 py-0.5 text-xs font-medium text-glacier"
                            }
                          >
                            {m.action === "create" ? "Création" : "Mise à jour"}
                          </span>
                        </td>
                        <td data-label="Catégorie" className={t.td}>
                          {m.category}
                          {m.categoryCreated && <span className="ml-1 text-xs text-muted">(nouvelle)</span>}
                        </td>
                        <td data-label="Prix / jour" className={t.td}>{formatPrice(m.dailyPriceCents)}</td>
                        <td data-label="Tailles" className={t.td}>
                          {m.sizes.join(", ")} · {m.totalStock} ex.
                        </td>
                        <td data-label="Photos" className={t.td}>{m.images || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="accent" disabled={!preview.valid || importing} onClick={confirm}>
                <Upload className="h-4 w-4" aria-hidden="true" /> {importing ? "Import en cours…" : "Confirmer l'import"}
              </Button>
              {!preview.valid && <span className="text-sm text-muted">Corrigez le fichier puis choisissez-le à nouveau.</span>}
              {importing && preview.materials.some((m) => m.images > 0) && (
                <span className="text-sm text-muted">Récupération des photos : cela peut prendre un moment.</span>
              )}
            </div>
          </div>
        )}

        {result && (
          <div role="status" className="flex flex-col gap-2 rounded-2xl border border-green-200 dark:border-green-400/30 bg-green-50 dark:bg-green-400/10 p-4 text-sm text-green-900 dark:text-green-200">
            <p className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Import terminé
            </p>
            <p>
              {result.created} créé{result.created > 1 ? "s" : ""}, {result.updated} mis à jour, {result.categoriesCreated} catégorie
              {result.categoriesCreated > 1 ? "s" : ""} créée{result.categoriesCreated > 1 ? "s" : ""}, {result.imagesAdded} photo
              {result.imagesAdded > 1 ? "s" : ""} ajoutée{result.imagesAdded > 1 ? "s" : ""}.
            </p>
            {result.warnings.length > 0 && <IssueList tone="warning" title="À vérifier" issues={result.warnings} />}
          </div>
        )}
      </section>

      {/* Aide */}
      <details className="rounded-3xl border border-line bg-surface p-5 text-sm md:p-6">
        <summary className="cursor-pointer font-semibold">Format des colonnes</summary>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-muted sm:grid-cols-[10rem_minmax(0,1fr)]">
          {[
            ["nom *", "Nom du matériel ; sert à reconnaître un matériel existant."],
            ["categorie *", "Nom de la catégorie ; créée si elle n'existe pas."],
            ["prix_jour *", "Prix par jour en euros : 25 ou 25,50."],
            ["taille *", "Une taille par ligne : 160 cm, 42, M, Taille unique…"],
            ["stock *", "Nombre d'exemplaires de cette taille."],
            ["niveau", "tous niveaux, débutant, intermédiaire ou confirmé."],
            ["points_forts", "Séparés par « | » (12 au plus)."],
            ["description", "Texte libre."],
            ["images", "Adresses https de photos, séparées par « | » ; ignorées si le matériel a déjà des photos."],
            ["visible", "oui (par défaut) ou non."],
          ].map(([name, help]) => (
            <div key={name} className="contents">
              <dt className="font-mono text-xs font-semibold text-ink">{name}</dt>
              <dd>{help}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">* obligatoire. Les champs du matériel sont lus sur sa première ligne ; les lignes suivantes n&apos;ont besoin que du nom, de la catégorie, du prix, de la taille et du stock.</p>
      </details>
    </div>
  );
}

function IssueList({ tone, title, issues }: { tone: "error" | "warning"; title: string; issues: Issue[] }) {
  const styles =
    tone === "error"
      ? "border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-300"
      : "border-amber-300 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/10 text-amber-900 dark:text-amber-200";
  return (
    <div role={tone === "error" ? "alert" : undefined} className={`flex flex-col gap-2 rounded-2xl border p-4 text-sm ${styles}`}>
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {title}
      </p>
      <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {issues.map((issue, i) => (
          <li key={i}>
            <span className="font-semibold">{issue.line > 1 ? `Ligne ${issue.line}` : "En-têtes"} :</span> {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
