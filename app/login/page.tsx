import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { env } from "@/lib/env";
import { getAuthSession, isAuthConfigured, normalizeNextPath } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAuthSession();
  const params = await searchParams;
  const nextPath = normalizeNextPath(params.next);

  if (session) {
    redirect(nextPath);
  }

  return (
    <LoginForm
      configured={isAuthConfigured()}
      nextPath={nextPath}
      defaultUsername={env.ADMIN_USERNAME || ""}
    />
  );
}
