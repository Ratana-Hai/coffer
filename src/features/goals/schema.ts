import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Name this goal").max(60),
  target: z.coerce.number().min(1, "Set a target amount"),
});

export type GoalInput = z.infer<typeof goalSchema>;

export const addFundsSchema = z.object({
  goalId: z.string().uuid(),
  amount: z.coerce.number().gt(0, "Amount must be more than zero"),
});

export type AddFundsInput = z.infer<typeof addFundsSchema>;
