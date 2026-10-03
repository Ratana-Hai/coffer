"use client";

import { useState } from "react";
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

export interface ShellUser {
  name?: string | null;
  email?: string | null;
}

const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "KHR", symbol: "៛" },
];

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
  collapsed = false,
  hasSecondFactor = false,
}: {
  user: ShellUser | null;
  collapsed?: boolean;
  hasSecondFactor?: boolean;
}) {
  const [currency, setCurrency] = useState("USD");
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
        {currencies.map(({ code, symbol }) => (
          <DropdownMenuCheckboxItem
            key={code}
            checked={currency === code}
            onSelect={(event) => {
              event.preventDefault();
              setCurrency(code);
            }}
          >
            <span className="flex-1">{code}</span>
            <span className="text-muted">{symbol}</span>
          </DropdownMenuCheckboxItem>
        ))}

        {hasSecondFactor && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Lock aria-hidden="true" />
              Lock now
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
