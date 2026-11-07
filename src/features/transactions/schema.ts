import { z } from "zod";

export const transactionSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    desc: z.string().trim().min(1, "Describe the transaction").max(120),
    amount: z.coerce.number().gt(0, "Amount must be more than zero"),
    type: z.enum(["income", "expense"]),
    category: z.string().optional(),
  })
  .refine((value) => value.type === "income" || Boolean(value.category), {
    path: ["category"],
    message: "Choose a category",
  })
  .refine((value) => value.category !== "loan", {
    path: ["category"],
    message: "Loan payments are recorded from the Loans page",
  });

export type TransactionInput = z.infer<typeof transactionSchema>;

export const transactionFiltersSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().min(1).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const cursorSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}::[0-9a-fA-F-]{36}$/);
