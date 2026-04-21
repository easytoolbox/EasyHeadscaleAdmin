import { EmptyState } from "@/components/shared/empty-state";
import { UsersTable } from "@/features/users/users-table";
import { getDisplayTimeZone } from "@/server/display-settings-service";
import { listUsers } from "@/server/headscale-service";

export default async function UsersPage() {
  const [users, timeZone] = await Promise.all([listUsers(), getDisplayTimeZone()]);

  if (!users.length) {
    return <EmptyState title="No users yet" description="Create your first Headscale user to start attaching nodes and issuing preauth keys." />;
  }

  return <UsersTable users={users} timeZone={timeZone} />;
}
