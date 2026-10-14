"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { profileSchema } from "@/lib/validation";

export type ProfileFormState = { ok?: boolean; error?: string } | undefined;

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    schoolOrigin: formData.get("schoolOrigin"),
    gradeLevel: formData.get("gradeLevel"),
    interests: formData.getAll("interests").map(String),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Data yang kamu isi belum lengkap.",
    };
  }

  await db
    .update(users)
    .set({
      fullName: parsed.data.fullName,
      schoolOrigin: parsed.data.schoolOrigin,
      gradeLevel: parsed.data.gradeLevel,
      initialInterests: parsed.data.interests,
    })
    .where(eq(users.id, session.user.id));

  return { ok: true };
}

export async function restartTourAction() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await db
    .update(users)
    .set({ onboardingCompletedAt: null })
    .where(eq(users.id, session.user.id));

  redirect("/onboarding");
}
