"use client";

import { ChevronsUpDown, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/lib/finance/currency";
import { lockNow } from "@/features/auth/actions";
import { setCurrency } from "@/features/settings/actions";

export interface ShellUser {
  name?: string | null;
  email?: string | null;
}

function initials(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function AccountMenu({
  user,
  currencyCode,
  collapsed = false,
}: {
  user: ShellUser | null;
  currencyCode: string;
  collapsed?: boolean;
}) {
  const displayName = user?.name?.trim() || user?.email?.trim() || "You";
  const email = user?.email?.trim() || "Personal ledger";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors outline-none hover:bg-sidebar-hover focus-visible:ring-2 focus-visible:ring-accent",
          collapsed && "justify-center px-0",
        )}
        title={displayName}
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink"
        >
          {initials(user?.name ?? user?.email)}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{displayName}</span>
              <span className="block truncate text-xs text-sidebar-muted">{email}</span>
            </span>
            <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-sidebar-muted" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-64">
        <div className="flex items-center gap-3 px-3 py-2">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink"
          >
            {initials(user?.name ?? user?.email)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted">Personal ledger</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted">Display currency</DropdownMenuLabel>
        {CURRENCIES.map(({ code, symbol }) => (
          <DropdownMenuCheckboxItem
            key={code}
            checked={currencyCode === code}
            onSelect={(event) => {
              event.preventDefault();
              void setCurrency(code);
            }}
          >
            <span className="flex-1">{code}</span>
            <span className="text-muted">{symbol}</span>
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void lockNow()}>
          <Lock aria-hidden="true" />
          Lock now
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
