import type { Minor } from "@/lib/finance/money";

export interface Goal {
  id: string;
  name: string;
  target: Minor;
  saved: Minor;
  pct: number;
}
