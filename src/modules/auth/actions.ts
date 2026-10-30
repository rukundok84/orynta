"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/modules/db/client";
import type { AuthFormState } from "./definitions";
import { hashPassword, verifyPassword } from "./password";
import { createSession, deleteSession } from "./session";

const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters long." })
    .trim(),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { error: "Be at least 8 characters long." })
    .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
    .regex(/[0-9]/, { error: "Contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { error: "Contain at least one special character." })
    .trim(),
});

const LoginFormSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Please enter your password." }),
});

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const user = await db.user.create({
      data: { name, email, passwordHash: hashPassword(password) },
    });
    await createSession(user.id);
  } catch (error) {
    // P2002 = unique constraint violation: the email was taken between the
    // form being rendered and the submit. Show it as a friendly error.
    if ((error as { code?: string })?.code === "P2002") {
      return { message: "An account with this email already exists." };
    }
    throw error;
  }

  redirect("/");
}

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    // Same message for "no such user" and "wrong password", so the form
    // can't be used to discover which emails have accounts.
    return { message: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
