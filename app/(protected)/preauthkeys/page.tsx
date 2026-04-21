import { PreAuthKeysManager } from "@/features/preauthkeys/preauthkeys-manager";
import { getDisplayTimeZone } from "@/server/display-settings-service";
import { listPreAuthKeys, listUsers } from "@/server/headscale-service";

export default async function PreAuthKeysPage() {
  const [keys, users, timeZone] = await Promise.all([listPreAuthKeys(), listUsers(), getDisplayTimeZone()]);

  return <PreAuthKeysManager keys={keys} users={users} timeZone={timeZone} />;
}
