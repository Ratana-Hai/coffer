import { z } from "zod";

export const loanSchema = z.object({
  name: z.string().trim().min(1, "Name this loan").max(60),
  principal: z.coerce.number().min(1, "Enter the amount borrowed"),
  rate: z.coerce.number().min(0).max(100, "Rate must be 0–100"),
  termMonths: z.coerce.number().int().min(1).max(600, "Term must be 1–600 months"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the first payment date"),
});

export type LoanInput = z.infer<typeof loanSchema>;

export const paymentSchema = z.object({
  loanId: z.string().uuid(),
  amount: z.coerce.number().gt(0, "Amount must be more than zero"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
