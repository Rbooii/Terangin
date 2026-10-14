"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signUpSchema } from "@/lib/validation";

export type AuthFormState = { error?: string } | undefined;

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data yang kamu isi belum valid.",
    };
  }

  const email = parsed.data.email.toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "Email ini udah terdaftar. Coba masuk aja." };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  await db.insert(users).values({
    fullName: parsed.data.fullName,
    email,
    passwordHash,
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Akun kamu dibuat, tapi gagal masuk otomatis. Coba login manual ya." };
    }
    throw error;
  }

  return undefined;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").toLowerCase(),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Email atau password salah." };
      }
      return { error: "Gagal masuk. Coba lagi ya." };
    }
    throw error;
  }

  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
