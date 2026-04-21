import { ApiKeysManager } from "@/features/apikeys/apikeys-manager";
import { getDisplayTimeZone } from "@/server/display-settings-service";
import { listApiKeys } from "@/server/headscale-service";

export default async function ApiKeysPage() {
  const [keys, timeZone] = await Promise.all([listApiKeys(), getDisplayTimeZone()]);
  return <ApiKeysManager keys={keys} timeZone={timeZone} />;
}
