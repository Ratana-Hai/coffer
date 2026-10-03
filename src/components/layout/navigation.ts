import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
  PieChart,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  segment: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/overview", label: "Overview", segment: "overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", segment: "transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", segment: "budgets", icon: PieChart },
  { href: "/loans", label: "Loans", segment: "loans", icon: Landmark },
  { href: "/goals", label: "Goals", segment: "goals", icon: Target },
];

export const settingsItem: NavItem = {
  href: "/settings",
  label: "Settings",
  segment: "settings",
  icon: Settings,
};
