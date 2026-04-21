import { EmptyState } from "@/components/shared/empty-state";
import { NodesBatchManager } from "@/features/nodes/nodes-batch-manager";
import { listNodes, listUsers } from "@/server/headscale-service";

export default async function NodesPage() {
  const [nodes, users] = await Promise.all([listNodes(), listUsers()]);

  if (!nodes.length) {
    return <EmptyState title="No nodes registered" description="Connect a device to Headscale and it will appear here with status, tags and route info." />;
  }

  return <NodesBatchManager nodes={nodes} users={users} />;
}
