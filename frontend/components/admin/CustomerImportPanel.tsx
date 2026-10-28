"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { CheckCircle2, Download, FileUp, ShieldCheck, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CUSTOMER_TEMPLATE, EXPORT_CUSTOMERS, IMPORT_CUSTOMERS, PREVIEW_CUSTOMER_IMPORT } from "@/lib/graphql/customers";
import { downloadCsv, IssueList, readCsvFile, today, type Issue } from "./csv";
import { t } from "./table";

type Action = "create" | "update" | "skip";
type Preview = {
  rows: number;
  valid: boolean;
  customers: { line: number; email: string; firstName: string; lastName: string; city: string | null; action: Action }[];
  errors: Issue[];
  warnings: Issue[];
};
type Result = { created: number; updated: number; skipped: number };

const ACTIONS: Record<Action, { label: string; className: string }> = {
  create: { label: "Création", className: "bg-green-100 dark:bg-green-400/15 text-green-800 dark:text-green-300" },
  update: { label: "Mise à jour", className: "bg-sky-50 dark:bg-glacier/15 text-glacier" },
  skip: { label: "Ignorée", className: "bg-line text-muted" },
};

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

// Fichier clients : export (sans aucune donnée de connexion), modèle, import avec aperçu.
export function CustomerImportPanel() {
  const router = useRouter();
  const client = useApolloClient();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; csv: string } | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runPreview, { loading: analysing }] = useMutation<{ previewCustomerImport: Preview }>(PREVIEW_CUSTOMER_IMPORT);
  const [runImport, { loading: importing }] = useMutation<{ importCustomers: Result }>(IMPORT_CUSTOMERS);

  async function exportFile(kind: "clients" | "modele") {
    setError(null);
    try {
      if (kind === "clients") {
        const { data } = await client.query<{ exportCustomersCsv: string }>({ query: EXPORT_CUSTOMERS, fetchPolicy: "network-only" });
        downloadCsv(data!.exportCustomersCsv, `snow-wild-clients-${today()}.csv`);
      } else {
        const { data } = await client.query<{ customerImportTemplate: string }>({ query: CUSTOMER_TEMPLATE });
        downloadCsv(data!.customerImportTemplate, "snow-wild-modele-clients.csv");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Téléchargement impossible.");
    }
  }

  async function choose(selected: File) {
    setError(null);
    setPreview(null);
    setResult(null);
    try {
      const csv = await readCsvFile(selected);
      setFile({ name: selected.name, csv });
      const { data } = await runPreview({ variables: { csv } });
      setPreview(data!.previewCustomerImport);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse impossible.");
    }
  }

  async function confirm() {
    if (!file) return;
    setError(null);
    try {
      const { data } = await runImport({ variables: { csv: file.csv } });
      setResult(data!.importCustomers);
      setPreview(null);
      setFile(null);
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible.");
    }
  }

  const count = (action: Action) => preview?.customers.filter((c) => c.action === action).length ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Exporter</h2>
          <p className="text-sm text-muted">
            Coordonnées, origine de la fiche et résumé des réservations. Aucun mot de passe ni donnée de connexion.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => exportFile("clients")}>
            <Download className="h-4 w-4" aria-hidden="true" /> Exporter les clients
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => exportFile("modele")}>
            <Download className="h-4 w-4" aria-hidden="true" /> Modèle vide
          </Button>
        </div>
        <p className="flex items-start gap-2 rounded-2xl bg-snow p-3 text-xs text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
          Données personnelles : le fichier est généré à la demande et n&apos;est pas conservé sur le serveur. Ne le partagez
          qu&apos;avec les personnes qui en ont besoin et supprimez-le après usage.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Importer</h2>
          <p className="text-sm text-muted">
            Colonnes <code className="font-mono text-xs">email ; prenom ; nom</code> (obligatoires), puis{" "}
            <code className="font-mono text-xs">telephone ; adresse ; code_postal ; ville</code>. Les fiches sont créées sans
            compte. Un e-mail déjà connu met la fiche à jour (une cellule vide garde l&apos;ancienne valeur) ; celui d&apos;un
            client inscrit est ignoré.
          </p>
        </div>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label="Fichier clients CSV"
          onChange={(e) => e.target.files?.[0] && choose(e.target.files[0])}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="accent" size="sm" disabled={analysing || importing} onClick={() => input.current?.click()}>
            <FileUp className="h-4 w-4" aria-hidden="true" /> {analysing ? "Analyse…" : "Choisir un fichier CSV"}
          </Button>
          {file && <span className="text-sm text-muted">{file.name}</span>}
        </div>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {result && (
          <p role="status" className="flex items-center gap-2 rounded-2xl border border-green-200 dark:border-green-400/30 bg-green-50 dark:bg-green-400/10 p-3 text-sm text-green-900 dark:text-green-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Import terminé : {result.created} fiche{result.created > 1 ? "s" : ""} créée{result.created > 1 ? "s" : ""},{" "}
            {result.updated} mise{result.updated > 1 ? "s" : ""} à jour, {result.skipped} ignorée{result.skipped > 1 ? "s" : ""}.
          </p>
        )}
      </section>

      {preview && (
        <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 md:p-6 lg:col-span-2">
          <p className="text-sm">
            <strong>{preview.rows}</strong> ligne{preview.rows > 1 ? "s" : ""} : <strong>{count("create")}</strong> à créer,{" "}
            <strong>{count("update")}</strong> à mettre à jour, <strong>{count("skip")}</strong> ignorée{count("skip") > 1 ? "s" : ""}.
          </p>
          {preview.errors.length > 0 && (
            <IssueList
              tone="error"
              title={`${plural(preview.errors.length, "erreur")} à corriger dans le fichier`}
              issues={preview.errors}
            />
          )}
          {preview.warnings.length > 0 && <IssueList tone="warning" title="À savoir" issues={preview.warnings} />}
          {preview.customers.length > 0 && (
            <div className={`${t.wrap} max-h-96 overflow-y-auto`}>
              <table className={t.table}>
                <thead className={t.thead}>
                  <tr>
                    <th className={t.th}>Client</th>
                    <th className={t.th}>E-mail</th>
                    <th className={t.th}>Ville</th>
                    <th className={t.th}>Action</th>
                  </tr>
                </thead>
                <tbody className={t.tbody}>
                  {preview.customers.map((c) => (
                    <tr key={c.line} className={t.tr}>
                      <td className={t.title}>{c.firstName} {c.lastName}</td>
                      <td data-label="E-mail" className={`${t.td} break-all`}>{c.email}</td>
                      <td data-label="Ville" className={t.td}>{c.city ?? "—"}</td>
                      <td data-label="Action" className={t.td}>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTIONS[c.action].className}`}>
                          {ACTIONS[c.action].label}
                        </span>
                      </td>
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
          </div>
        </section>
      )}
    </div>
  );
}
