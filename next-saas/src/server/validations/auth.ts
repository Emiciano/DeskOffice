import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  email: z.string().email("Bitte eine gueltige E-Mail eingeben"),
  password: z
    .string()
    .min(8, "Passwort muss mindestens 8 Zeichen haben")
    .regex(/[A-Z]/, "Mindestens ein Grossbuchstabe erforderlich")
    .regex(/[0-9]/, "Mindestens eine Zahl erforderlich"),
  companyName: z.string().min(2, "Firmenname ist erforderlich")
});

export const loginSchema = z.object({
  email: z.string().email("Bitte eine gueltige E-Mail eingeben"),
  password: z.string().min(1, "Passwort ist erforderlich")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
