import { ImportPanel } from "@/components/admin/ImportPanel";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata = { title: "Import / export" };

export default function ImportPage() {
  return (
    <>
      <PageHeader title="Import / export du catalogue" />
      <ImportPanel />
    </>
  );
}
