"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { onboardingSchema } from "@/lib/validation";

export type OnboardingFormState = { error?: string } | undefined;

export async function saveOnboardingAction(
  _prev: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = onboardingSchema.safeParse({
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
      schoolOrigin: parsed.data.schoolOrigin,
      gradeLevel: parsed.data.gradeLevel,
      initialInterests: parsed.data.interests,
    })
    .where(eq(users.id, session.user.id));

  redirect("/onboarding");
}

export async function completeOnboardingAction() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await db
    .update(users)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(users.id, session.user.id));

  redirect("/dashboard");
}
