import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function PageHeader({
  title,
  action,
  back,
}: {
  title: string;
  action?: { href: string; label: string };
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {back && (
        <Link href={back.href} className="text-sm text-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        {action && (
          <Link href={action.href} className={buttonVariants({ variant: "accent" })}>
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
