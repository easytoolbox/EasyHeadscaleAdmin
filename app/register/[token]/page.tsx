import { redirect } from "next/navigation";

import { RegistrationApproval } from "@/features/register/registration-approval";
import { getAuthSession } from "@/server/auth";
import { listUsers } from "@/server/headscale-service";

export const dynamic = "force-dynamic";

export default async function RegisterTokenPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getAuthSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/register/${token}`)}`);
  }

  const users = await listUsers();

  return <RegistrationApproval token={token} adminUsername={session.username} users={users} />;
}
