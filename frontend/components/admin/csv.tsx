import { AlertTriangle } from "lucide-react";

// Outils partagés par les imports / exports CSV du back-office.

export type Issue = { line: number; message: string };

export const CSV_MAX_BYTES = 500_000;

/** Fait télécharger un texte CSV par le navigateur, sans passer par le serveur. */
export function downloadCsv(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

export const today = () => new Date().toISOString().slice(0, 10);

/** Lit le fichier choisi ; refuse un fichier trop lourd ou mal encodé (Excel « CSV » non UTF-8). */
export async function readCsvFile(file: File): Promise<string> {
  if (file.size > CSV_MAX_BYTES) throw new Error("Fichier trop volumineux (500 Ko au maximum).");
  const csv = await file.text();
  if (csv.includes("�")) {
    throw new Error("Les accents du fichier sont illisibles : dans Excel, enregistrez-le au format « CSV UTF-8 ».");
  }
  return csv;
}

export function IssueList({ tone, title, issues }: { tone: "error" | "warning"; title: string; issues: Issue[] }) {
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
