import { AppError } from "@/lib/errors";
import { HeadscaleClient } from "@/lib/headscale/client";
import {
  type DashboardHealthSnapshot,
  type GlobalSearchResult,
  type HeadscaleNode,
  type HeadscaleRoute
} from "@/lib/headscale/types";
import { recordAuditEvent } from "@/server/audit-service";
import { db } from "@/server/db";
import { getDecryptedConfig } from "@/server/config-service";

async function getClient() {
  const config = await getDecryptedConfig();
  return new HeadscaleClient({
    serverUrl: config.serverUrl,
    apiKey: config.apiKey
  });
}

function normalizeNode(node: HeadscaleNode): HeadscaleNode {
  return {
    ...node,
    tags: node.tags ?? node.validTags ?? [],
    availableRoutes: node.availableRoutes ?? [],
    approvedRoutes: node.approvedRoutes ?? [],
    primaryRoutes: node.primaryRoutes ?? [],
    routeCount: (node.availableRoutes ?? []).length
  };
}

function markSoonExpiring<T extends { expiration?: string | null }>(items: T[]) {
  const soon = Date.now() + 1000 * 60 * 60 * 24 * 7;
  return items.map((item) => ({
    ...item,
    expiresSoon: item.expiration ? new Date(item.expiration).getTime() <= soon : false,
    expired: item.expiration ? new Date(item.expiration).getTime() <= Date.now() : false
  }));
}

async function persistHealthSnapshot(snapshot: DashboardHealthSnapshot) {
  const key = "healthSnapshots";
  const active = await db.headscaleInstance.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" }
  });
  if (!active) return [];

  const existing = await db.systemSetting.findUnique({
    where: {
      instanceId_key: {
        instanceId: active.id,
        key
      }
    }
  });

  const previous = existing?.value ? (JSON.parse(existing.value) as DashboardHealthSnapshot[]) : [];
  const next = [...previous.slice(-11), snapshot];

  await db.systemSetting.upsert({
    where: {
      instanceId_key: {
        instanceId: active.id,
        key
      }
    },
    create: {
      instanceId: active.id,
      key,
      value: JSON.stringify(next)
    },
    update: {
      value: JSON.stringify(next)
    }
  });

  return next;
}

export async function validateHeadscaleConfig(input: { serverUrl: string; apiKey: string }) {
  const client = new HeadscaleClient(input);
  await client.validateConnection();
  return client.getVersion();
}

export async function getDashboardData() {
  const client = await getClient();
  const [users, nodes, preAuthKeys, apiKeys, version] = await Promise.all([
    client.listUsers(),
    client.listNodes(),
    client.listPreAuthKeys(),
    client.listApiKeys(),
    client.getVersion().catch(() => "unknown")
  ]);

  const normalizedNodes = nodes.map(normalizeNode);
  const routes = normalizedNodes.flatMap((node) => node.availableRoutes ?? []);
  const pendingRoutes = normalizedNodes.flatMap((node) =>
    (node.availableRoutes ?? []).filter((route) => !(node.approvedRoutes ?? []).includes(route))
  );
  const anomalousNodes = normalizedNodes
    .filter((node) => node.expired || !node.online)
    .slice(0, 5);
  const expiringPreAuthKeys = markSoonExpiring(preAuthKeys).filter((key) => key.expiresSoon).slice(0, 5);
  const expiringApiKeys = markSoonExpiring(apiKeys).filter((key) => key.expiresSoon).slice(0, 5);
  const healthTrend = await persistHealthSnapshot({
    timestamp: new Date().toISOString(),
    activeNodes: normalizedNodes.filter((node) => node.online).length,
    expiredNodes: normalizedNodes.filter((node) => node.expired).length,
    pendingRoutes: pendingRoutes.length
  });

  return {
    stats: {
      users: users.length,
      nodes: normalizedNodes.length,
      activeNodes: normalizedNodes.filter((node) => node.online).length,
      expiredNodes: normalizedNodes.filter((node) => node.expired).length,
      routes: routes.length,
      preAuthKeys: preAuthKeys.length,
      apiKeys: apiKeys.length
    },
    recentUsers: users.slice(0, 5),
    recentNodes: normalizedNodes.slice(0, 6),
    alerts: {
      anomalousNodes,
      pendingRoutes: pendingRoutes.slice(0, 8),
      expiringPreAuthKeys,
      expiringApiKeys
    },
    healthTrend,
    health: {
      connected: true,
      version
    }
  };
}

export async function listUsers() {
  const client = await getClient();
  return client.listUsers();
}

export async function createUser(name: string) {
  const client = await getClient();
  const user = await client.createUser(name);
  await recordAuditEvent({
    action: "create_user",
    targetType: "user",
    targetId: user?.id ?? name,
    detail: {
      userName: user?.name ?? name
    }
  });
  return user;
}

export async function getUserDetail(identifier: string) {
  const client = await getClient();
  const [users, nodes, preAuthKeys, routes] = await Promise.all([
    client.listUsers(),
    client.listNodes(),
    client.listPreAuthKeys(),
    listRoutes()
  ]);

  const user = users.find((item) => item.id === identifier || item.name === identifier);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return {
    user,
    nodes: nodes.filter((node) => node.user?.id === user.id || node.user?.name === user.name).map(normalizeNode),
    preAuthKeys: preAuthKeys.filter((key) => key.user?.id === user.id || key.user?.name === user.name),
    routes: routes.filter((route) => route.userName === user.name)
  };
}

export async function renameUser(identifier: string, name: string) {
  const client = await getClient();
  const user = await client.renameUser(identifier, name);
  await recordAuditEvent({
    action: "rename_user",
    targetType: "user",
    targetId: user?.id ?? identifier,
    detail: {
      userName: user?.name ?? name,
      requestedIdentifier: identifier
    }
  });
  return user;
}

export async function cleanupOfflineUserNodes(identifier: string, specificNodeIds?: string[]) {
  const detail = await getUserDetail(identifier);
  const candidates = detail.nodes.filter((node) => !node.online).map((node) => node.id);
  const nodeIds = specificNodeIds?.length ? candidates.filter((id) => specificNodeIds.includes(id)) : candidates;
  await Promise.all(nodeIds.map((id) => deleteNode(id)));
  await recordAuditEvent({
    action: "cleanup_offline_user_nodes",
    targetType: "user",
    targetId: detail.user.id,
    detail: {
      userName: detail.user.name,
      nodeIds
    }
  });
  return { removed: nodeIds.length };
}

export async function deleteUser(identifier: string) {
  const client = await getClient();
  const users = await client.listUsers();
  const user = users.find((item) => item.id === identifier || item.name === identifier);
  await client.deleteUser(identifier);
  await recordAuditEvent({
    action: "delete_user",
    targetType: "user",
    targetId: user?.id ?? identifier,
    detail: {
      userName: user?.name ?? identifier
    }
  });
}

export async function listNodes() {
  const client = await getClient();
  const nodes = await client.listNodes();
  return nodes.map(normalizeNode);
}

export async function getNodeDetail(identifier: string) {
  const nodes = await listNodes();
  const node = nodes.find((item) => item.id === identifier || item.name === identifier);
  if (!node) {
    throw new AppError("Node not found", 404, "NODE_NOT_FOUND");
  }
  return node;
}

export async function renameNode(identifier: string, name: string) {
  const client = await getClient();
  const node = await client.renameNode(identifier, name);
  await recordAuditEvent({
    action: "rename_node",
    targetType: "node",
    targetId: node?.id ?? identifier,
    detail: {
      nodeName: node?.name ?? name,
      requestedIdentifier: identifier
    }
  });
  return node;
}

export async function deleteNode(identifier: string) {
  const client = await getClient();
  const nodes = await client.listNodes();
  const node = nodes.find((item) => item.id === identifier || item.name === identifier);
  await client.deleteNode(identifier);
  await recordAuditEvent({
    action: "delete_node",
    targetType: "node",
    targetId: node?.id ?? identifier,
    detail: {
      nodeName: node?.name ?? identifier,
      userName: node?.user?.name ?? null
    }
  });
}

export async function expireNode(identifier: string) {
  const client = await getClient();
  await client.expireNode(identifier);
  await recordAuditEvent({
    action: "expire_node",
    targetType: "node",
    targetId: identifier,
    detail: {
      requestedIdentifier: identifier
    }
  });
}

export async function moveNodeToUser(identifier: string, user: string) {
  const client = await getClient();
  const node = await client.reassignNode(identifier, user);
  await recordAuditEvent({
    action: "reassign_node",
    targetType: "node",
    targetId: node?.id ?? identifier,
    detail: {
      nodeName: node?.name ?? identifier,
      targetUser: user
    }
  });
  return node;
}

export async function updateNodeTags(identifier: string, tags: string[]) {
  const client = await getClient();
  const node = await client.setNodeTags(identifier, tags);
  await recordAuditEvent({
    action: "set_node_tags",
    targetType: "node",
    targetId: node?.id ?? identifier,
    detail: {
      nodeName: node?.name ?? identifier,
      tags
    }
  });
  return node;
}

export async function registerNodeToUser(input: {
  registrationKey: string;
  user: string;
}) {
  const client = await getClient();
  const node = await client.registerNode({
    registrationKey: input.registrationKey,
    user: input.user
  });

  await recordAuditEvent({
    action: "register_node",
    targetType: "node",
    targetId: node?.id ?? input.registrationKey,
    detail: {
      registrationKey: input.registrationKey,
      targetUser: input.user,
      nodeName: node?.name ?? null
    }
  });

  return node;
}

export async function registerPendingNodeForAdmin(input: {
  token: string;
  adminUsername: string;
  user?: string;
}) {
  const client = await getClient();
  const users = await client.listUsers();
  const requestedUser = input.user?.trim() || input.adminUsername;
  const targetUser = users.find((user) => user.name === requestedUser || user.id === requestedUser);

  if (!targetUser) {
    throw new AppError(
      `Headscale user "${requestedUser}" not found.`,
      404,
      "USER_NOT_FOUND"
    );
  }

  const node = await client.registerNode({
    registrationKey: input.token,
    user: targetUser.name
  });

  await recordAuditEvent({
    action: "register_node",
    targetType: "node",
    targetId: node?.id ?? input.token,
    detail: {
      registrationKey: input.token,
      targetUser: targetUser.name,
      nodeName: node?.name ?? null,
      initiatedByAdmin: input.adminUsername
    }
  });

  return {
    node,
    user: targetUser.name
  };
}

export async function applyNodeBatchAction(input: {
  action: "delete" | "expire" | "reassign" | "set-tags";
  nodeIds: string[];
  user?: string;
  tags?: string[];
}) {
  if (!input.nodeIds.length) {
    throw new AppError("No nodes selected", 400, "NO_NODES_SELECTED");
  }

  switch (input.action) {
    case "delete":
      await Promise.all(input.nodeIds.map((id) => deleteNode(id)));
      return { processed: input.nodeIds.length };
    case "expire":
      await Promise.all(input.nodeIds.map((id) => expireNode(id)));
      return { processed: input.nodeIds.length };
    case "reassign":
      if (!input.user) throw new AppError("Target user is required", 400, "TARGET_USER_REQUIRED");
      await Promise.all(input.nodeIds.map((id) => moveNodeToUser(id, input.user!)));
      return { processed: input.nodeIds.length };
    case "set-tags":
      await Promise.all(input.nodeIds.map((id) => updateNodeTags(id, input.tags ?? [])));
      return { processed: input.nodeIds.length };
  }
}

export async function listPreAuthKeys() {
  const client = await getClient();
  return markSoonExpiring(await client.listPreAuthKeys());
}

export async function createPreAuthKey(input: {
  user?: string;
  reusable: boolean;
  ephemeral: boolean;
  expiration?: string;
  aclTags?: string[];
}) {
  const client = await getClient();
  let resolvedUserId: string | number | undefined = undefined;

  if (input.user) {
    if (/^\d+$/.test(input.user)) {
      resolvedUserId = Number(input.user);
    } else {
      const users = await client.listUsers();
      const matchedUser = users.find((user) => user.name === input.user || user.id === input.user);

      if (!matchedUser) {
        throw new AppError(`User "${input.user}" not found`, 404, "USER_NOT_FOUND");
      }

      resolvedUserId = /^\d+$/.test(matchedUser.id) ? Number(matchedUser.id) : matchedUser.id;
    }
  }

  const key = await client.createPreAuthKey({
    userId: resolvedUserId,
    reusable: input.reusable,
    ephemeral: input.ephemeral,
    expiration: input.expiration,
    aclTags: input.aclTags
  });

  await recordAuditEvent({
    action: "create_preauth_key",
    targetType: "preauthkey",
    targetId: key?.id ?? "new",
    detail: {
      userName: key?.user?.name ?? input.user ?? null,
      reusable: key?.reusable ?? input.reusable,
      ephemeral: key?.ephemeral ?? input.ephemeral
    }
  });
  return key;
}

export async function deletePreAuthKey(id: string) {
  const client = await getClient();
  const keys = await client.listPreAuthKeys();
  const matchedKey = keys.find((item) => item.id === id || item.key === id);
  await client.expireOrDeletePreAuthKey(id, matchedKey?.key);
  const remainingKeys = await client.listPreAuthKeys();
  const stillExists = remainingKeys.find((item) => item.id === id || item.key === id || item.key === matchedKey?.key);

  await recordAuditEvent({
    action: "expire_preauth_key",
    targetType: "preauthkey",
    targetId: matchedKey?.id ?? id
  });

  return {
    status: stillExists ? "expired" : "removed"
  } as const;
}

export async function listApiKeys() {
  const client = await getClient();
  return markSoonExpiring(await client.listApiKeys());
}

export async function createApiKey(expiration?: string) {
  const client = await getClient();
  const payload = (await client.createApiKey(expiration)) as {
    apiKey?: { prefix?: string; expiration?: string | null; createdAt?: string | null; key?: string };
    key?: string;
    prefix?: string;
    expiration?: string | null;
    createdAt?: string | null;
  };

  const created = payload.apiKey ?? payload;
  const rawKey = payload.key ?? payload.apiKey?.key;

  const result = {
    prefix: created.prefix ?? "new",
    expiration: created.expiration ?? expiration ?? null,
    createdAt: created.createdAt ?? new Date().toISOString(),
    key: rawKey,
    commandHint: rawKey ? `Authorization: Bearer ${rawKey}` : undefined
  };
  await recordAuditEvent({
    action: "create_api_key",
    targetType: "apikey",
    targetId: result.prefix,
    detail: {
      expiration: result.expiration
    }
  });
  return result;
}

export async function deleteApiKey(prefix: string) {
  const client = await getClient();
  await client.expireApiKey(prefix);
  await recordAuditEvent({
    action: "expire_api_key",
    targetType: "apikey",
    targetId: prefix
  });
}

export async function listRoutes(): Promise<HeadscaleRoute[]> {
  const client = await getClient();
  const [routes, nodes] = await Promise.all([client.listRoutes(), client.listNodes()]);
  const nodeMap = new Map(nodes.map((node) => [node.id, normalizeNode(node)]));

  return routes.map((route) => {
    const node = nodeMap.get(route.nodeId);
    return {
      ...route,
      nodeOnline: node?.online,
      userName: node?.user?.name
    };
  });
}

export async function updateNodeRoutes(nodeId: string, routes: string[]) {
  const client = await getClient();
  const response = await client.updateNodeRoutes(nodeId, routes);
  await recordAuditEvent({
    action: "update_node_routes",
    targetType: "route",
    targetId: nodeId,
    detail: {
      nodeId,
      routes
    }
  });
  return response;
}

export async function getHealthData() {
  const config = await getDecryptedConfig();
  const client = new HeadscaleClient({
    serverUrl: config.serverUrl,
    apiKey: config.apiKey
  });

  const version = await client.getVersion();
  await client.validateConnection();

  return {
    connected: true,
    version,
    serverUrl: config.serverUrl,
    instanceName: config.name,
    lastValidatedAt: config.lastValidatedAt?.toISOString() ?? null
  };
}

export async function searchResources(query: string): Promise<GlobalSearchResult> {
  const normalized = query.trim().toLowerCase();
  const [users, nodes, routes, preAuthKeys, apiKeys] = await Promise.all([
    listUsers(),
    listNodes(),
    listRoutes(),
    listPreAuthKeys(),
    listApiKeys()
  ]);

  return {
    users: users.filter((item) => item.name.toLowerCase().includes(normalized) || (item.displayName ?? "").toLowerCase().includes(normalized)),
    nodes: nodes.filter((item) =>
      [item.name, item.givenName ?? "", item.user?.name ?? "", ...(item.ipAddresses ?? []), ...(item.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    ),
    routes: routes.filter((item) => `${item.prefix} ${item.nodeName} ${item.userName ?? ""}`.toLowerCase().includes(normalized)),
    preAuthKeys: preAuthKeys.filter((item) => `${item.id} ${item.user?.name ?? ""} ${item.aclTags?.join(" ") ?? ""}`.toLowerCase().includes(normalized)),
    apiKeys: apiKeys.filter((item) => `${item.prefix}`.toLowerCase().includes(normalized))
  };
}
