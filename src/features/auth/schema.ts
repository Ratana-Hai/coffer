import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter a username").max(40),
  email: z.string().trim().email("Enter a valid email address").max(80),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(80),
  next: z.string().optional(),
});

export const totpCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type TotpCodeInput = z.infer<typeof totpCodeSchema>;
