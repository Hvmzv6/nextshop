import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a digit.");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
