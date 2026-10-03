"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AccountMenu, type ShellUser } from "./AccountMenu";
import { navItems, settingsItem } from "./navigation";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  user: ShellUser | null;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onAddTransaction: () => void;
  hasSecondFactor?: boolean;
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center gap-2.5 px-2",
        collapsed && "justify-center px-0",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-ink"
      >
        C
      </span>
      {!collapsed && (
        <span className="truncate text-lg font-semibold tracking-tight">
          coffer<span className="text-accent">.</span>
        </span>
      )}
    </div>
  );
}

function NavRow({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: (typeof navItems)[number]["icon"];
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "font-semibold text-sidebar-foreground"
          : "text-sidebar-muted hover:bg-sidebar-hover/40 hover:text-sidebar-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
          active && "bg-sidebar-hover",
        )}
      >
        <Icon className="size-[1.15rem] shrink-0" />
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  onNavigate,
  user,
  onAddTransaction,
  hasSecondFactor,
}: {
  collapsed: boolean;
  onNavigate: () => void;
  user: ShellUser | null;
  onAddTransaction: () => void;
  hasSecondFactor?: boolean;
}) {
  const pathname = usePathname();
  const SettingsIcon = settingsItem.icon;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-3">
      <Brand collapsed={collapsed} />

      <nav aria-label="Main navigation" className="flex min-w-0 flex-col gap-1">
        {navItems.map(({ href, label, icon }) => (
          <NavRow
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={isActive(pathname, href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className={cn("shrink-0", collapsed ? "px-1.5" : "px-0")}>
        <Button
          variant="default"
          onClick={onAddTransaction}
          title={collapsed ? "Add transaction" : undefined}
          aria-label={collapsed ? "Add transaction" : undefined}
          className={cn("h-11 w-full", collapsed ? "justify-center px-0" : "justify-start gap-3")}
        >
          <Plus aria-hidden="true" className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">Add transaction</span>}
        </Button>
      </div>

      <div className="min-h-0 flex-1" />

      <NavRow
        href={settingsItem.href}
        label={settingsItem.label}
        icon={SettingsIcon}
        active={isActive(pathname, settingsItem.href)}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      <div className="shrink-0 border-t border-sidebar-line pt-2">
        <AccountMenu user={user} collapsed={collapsed} hasSecondFactor={hasSecondFactor} />
      </div>
    </div>
  );
}

export function Sidebar({
  user,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
  onAddTransaction,
  hasSecondFactor,
}: SidebarProps) {
  return (
    <>
      <aside
        className="relative hidden h-full shrink-0 flex-col border-r border-sidebar-line bg-sidebar text-sidebar-foreground transition-[width] duration-200 min-[881px]:flex"
        style={{ width: collapsed ? 72 : 240 }}
      >
        <SidebarContent
          collapsed={collapsed}
          onNavigate={() => {}}
          user={user}
          onAddTransaction={onAddTransaction}
          hasSecondFactor={hasSecondFactor}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-4 -right-3.5 z-10 size-7 rounded-full border-sidebar-line bg-sidebar text-sidebar-foreground shadow-sm hover:bg-sidebar-hover"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-3.5" />
          ) : (
            <PanelLeftClose className="size-3.5" />
          )}
        </Button>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-72 gap-0 border-sidebar-line bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetHeader className="flex flex-row items-center justify-between border-b border-line px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <span
                aria-hidden="true"
                className="flex size-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-ink"
              >
                C
              </span>
              coffer<span className="text-accent">.</span>
            </SheetTitle>
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
            <SheetClose
              aria-label="Close navigation"
              className="flex size-11 items-center justify-center rounded-xl text-sidebar-muted transition-colors outline-none hover:bg-sidebar-hover focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="size-4" />
            </SheetClose>
          </SheetHeader>
          <SidebarContent
            collapsed={false}
            onNavigate={() => onMobileOpenChange(false)}
            user={user}
            onAddTransaction={() => {
              onMobileOpenChange(false);
              onAddTransaction();
            }}
            hasSecondFactor={hasSecondFactor}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
