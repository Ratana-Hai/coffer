import { z } from "zod";
import { MANUAL_CATEGORY_KEYS } from "@/lib/finance/categories";

export const budgetSchema = z.object({
  categoryKey: z.enum(MANUAL_CATEGORY_KEYS),
  monthlyLimit: z.coerce.number().nonnegative(),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
