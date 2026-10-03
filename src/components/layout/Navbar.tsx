"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navItems, settingsItem, type NavItem } from "./navigation";

const allItems: NavItem[] = [...navItems, settingsItem];

interface Breadcrumb {
  label: string;
  href?: string;
}

function singular(label: string): string {
  return label.endsWith("s") ? label.slice(0, -1) : label;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const first = allItems.find((item) => item.segment === segments[0]);
  const crumbs: Breadcrumb[] = [];

  if (segments.length === 1) {
    crumbs.push({ label: first?.label ?? segments[0] });
    return crumbs;
  }

  crumbs.push({ label: first?.label ?? segments[0], href: `/${segments[0]}` });

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index];
    const isLast = index === segments.length - 1;
    const nested = allItems.find((item) => item.segment === segment);
    let label = nested?.label;
    if (!label) label = isUuid(segment) && first ? singular(first.label) : segment;
    crumbs.push(isLast ? { label } : { label, href: segments.slice(0, index + 1).join("/") });
  }

  return crumbs;
}

export function Navbar({ onMenuClick, actions }: { onMenuClick: () => void; actions?: ReactNode }) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open navigation"
        onClick={onMenuClick}
        className="-ml-1 size-11 min-[881px]:hidden"
      >
        <Menu />
      </Button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span
              key={`${crumb.href ?? "current"}-${index}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {index > 0 ? (
                <span aria-hidden="true" className="shrink-0 text-muted">
                  /
                </span>
              ) : null}
              {isLast || !crumb.href ? (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="truncate text-muted hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">{actions}</div>
    </header>
  );
}
