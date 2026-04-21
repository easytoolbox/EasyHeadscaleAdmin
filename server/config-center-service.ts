import { AppError } from "@/lib/errors";
import {
  aclDefaults,
  type ConfigKind,
  type DerpConfig,
  type DerpEndpointStatus,
  type DerpMapDebugData,
  type DerpLiveState,
  type DerpRegionNode,
  derpDefaults,
  type DnsConfig,
  dnsDefaults,
  parseAclPolicy,
  summarizeDerp,
  summarizeDns
} from "@/lib/config-center";
import { db } from "@/server/db";
import { recordAuditEvent } from "@/server/audit-service";
import { getDecryptedConfig, requireActiveInstance } from "@/server/config-service";

const keys = {
  acl: "config.acl.current",
  dns: "config.dns.current",
  derp: "config.derp.current"
} satisfies Record<ConfigKind, string>;

async function getSetting(kind: ConfigKind) {
  const instance = await requireActiveInstance();
  const setting = await db.systemSetting.findUnique({
    where: {
      instanceId_key: {
        instanceId: instance.id,
        key: keys[kind]
      }
    }
  });

  return {
    instance,
    setting
  };
}

async function probeUrl(url: string): Promise<DerpEndpointStatus> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);

  try {
    let response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok && [400, 404, 405].includes(response.status)) {
      response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      });
    }

    return {
      target: url,
      source: "url",
      status: response.ok ? "available" : "unreachable",
      latencyMs: Date.now() - startedAt,
      detail: `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      target: url,
      source: "url",
      status: "unreachable",
      latencyMs: null,
      detail: error instanceof Error ? error.message : "Probe failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : null;
}

function normalizeDerpNodes(nodes: unknown, fallbackRegionId: number): DerpRegionNode[] {
  if (!Array.isArray(nodes)) return [];

  return nodes
    .map((node) => {
      if (!node || typeof node !== "object") return null;
      const value = node as Record<string, unknown>;
      return {
        name: String(value.Name ?? value.name ?? ""),
        hostName: String(value.HostName ?? value.hostname ?? value.hostName ?? ""),
        regionId: toNumber(value.RegionID ?? value.regionid ?? value.regionId) ?? fallbackRegionId,
        ipv4: value.IPv4 ? String(value.IPv4) : value.ipv4 ? String(value.ipv4) : null,
        ipv6: value.IPv6 ? String(value.IPv6) : value.ipv6 ? String(value.ipv6) : null,
        stunPort: toNumber(value.STUNPort ?? value.stunPort),
        derpPort: toNumber(value.DERPPort ?? value.derpPort)
      };
    })
    .filter((node): node is DerpRegionNode => Boolean(node && node.hostName));
}

function pickEmbeddedRegion(regions: Record<string, unknown>, serverUrl: string, fallback: DerpConfig) {
  const serverHost = new URL(serverUrl).hostname;
  const regionEntries = Object.entries(regions)
    .map(([key, region]) => {
      if (!region || typeof region !== "object") return null;
      const value = region as Record<string, unknown>;
      const regionId = toNumber(value.RegionID ?? value.regionid ?? value.regionId) ?? Number(key);
      const regionCode = String(value.RegionCode ?? value.regioncode ?? value.regionCode ?? "");
      const regionName = String(value.RegionName ?? value.regionname ?? value.regionName ?? "");
      const nodes = normalizeDerpNodes(value.Nodes ?? value.nodes, regionId);
      const score =
        nodes.some((node) => node.hostName === serverHost || node.hostName.endsWith(`.${serverHost}`)) ? 5 :
        regionCode === fallback.regionCode ? 4 :
        regionName === fallback.regionName ? 3 :
        regionCode === "headscale" ? 2 :
        regionName.toLowerCase().includes("headscale") ? 1 : 0;

      return {
        regionId,
        regionCode,
        regionName,
        nodes,
        score
      };
    })
    .filter((item): item is { regionId: number; regionCode: string; regionName: string; nodes: DerpRegionNode[]; score: number } => Boolean(item))
    .sort((left, right) => right.score - left.score || right.nodes.length - left.nodes.length);

  return regionEntries[0] ?? null;
}

async function fetchLiveDerpState(fallback: DerpConfig): Promise<DerpLiveState | null> {
  const config = await getDecryptedConfig();
  const candidates = ["/derpmap/default", "/derpmap"];

  for (const path of candidates) {
    try {
      const response = await fetch(new URL(path, config.serverUrl), {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) continue;

      const payload = await response.json();
      const regionsRaw = (payload?.Regions ?? payload?.regions) as Record<string, unknown> | undefined;
      if (!regionsRaw || typeof regionsRaw !== "object") continue;

      const embedded = pickEmbeddedRegion(regionsRaw, config.serverUrl, fallback);
      if (!embedded) {
        return {
          available: true,
          source: "derpmap",
          sourcePath: path,
          embeddedEnabled: false,
          regionId: fallback.regionId,
          regionCode: fallback.regionCode,
          regionName: fallback.regionName,
          nodeCount: 0,
          nodes: []
        };
      }

      return {
        available: true,
        source: "derpmap",
        sourcePath: path,
        embeddedEnabled: embedded.score > 0,
        regionId: embedded.regionId,
        regionCode: embedded.regionCode,
        regionName: embedded.regionName,
        nodeCount: embedded.nodes.length,
        nodes: embedded.nodes
      };
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchRawDerpMap(): Promise<DerpMapDebugData> {
  const config = await getDecryptedConfig();
  const candidates = ["/derpmap/default", "/derpmap"];

  for (const path of candidates) {
    try {
      const response = await fetch(new URL(path, config.serverUrl), {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) continue;

      const payload = await response.text();

      return {
        available: true,
        sourcePath: path,
        payload,
        note: null
      };
    } catch {
      continue;
    }
  }

  return {
    available: false,
    sourcePath: null,
    payload: null,
    note: "DERPMap endpoint is not reachable from the current Headscale server URL."
  };
}

export async function getAclConfig() {
  const { setting } = await getSetting("acl");
  const policy = setting?.value ?? aclDefaults;
  const { summary } = parseAclPolicy(policy);

  return {
    policy,
    summary
  };
}

export async function updateAclConfig(policy: string) {
  const { instance, setting } = await getSetting("acl");
  const before = setting?.value ?? aclDefaults;
  const beforeSummary = parseAclPolicy(before).summary;
  const afterSummary = parseAclPolicy(policy).summary;

  await db.systemSetting.upsert({
    where: {
      instanceId_key: {
        instanceId: instance.id,
        key: keys.acl
      }
    },
    create: {
      instanceId: instance.id,
      key: keys.acl,
      value: policy
    },
    update: {
      value: policy
    }
  });

  const audit = await recordAuditEvent({
    instanceId: instance.id,
    action: "update_acl_policy",
    targetType: "acl",
    targetId: instance.id,
    detail: {
      before,
      after: policy,
      beforeSummary,
      afterSummary
    }
  });

  return {
    policy,
    summary: afterSummary,
    auditLogId: audit.id
  };
}

export async function getDnsConfig() {
  const { setting } = await getSetting("dns");
  const config = setting?.value ? (JSON.parse(setting.value) as DnsConfig) : dnsDefaults;

  return {
    config,
    summary: summarizeDns(config)
  };
}

export async function updateDnsConfig(config: DnsConfig) {
  const { instance, setting } = await getSetting("dns");
  const before = setting?.value ? (JSON.parse(setting.value) as DnsConfig) : dnsDefaults;
  const after = config;

  await db.systemSetting.upsert({
    where: {
      instanceId_key: {
        instanceId: instance.id,
        key: keys.dns
      }
    },
    create: {
      instanceId: instance.id,
      key: keys.dns,
      value: JSON.stringify(after)
    },
    update: {
      value: JSON.stringify(after)
    }
  });

  const audit = await recordAuditEvent({
    instanceId: instance.id,
    action: "update_dns_config",
    targetType: "dns",
    targetId: instance.id,
    detail: {
      before,
      after,
      beforeSummary: summarizeDns(before),
      afterSummary: summarizeDns(after)
    }
  });

  return {
    config: after,
    summary: summarizeDns(after),
    auditLogId: audit.id
  };
}

export async function getDerpConfig() {
  const { setting } = await getSetting("derp");
  const config = setting?.value ? (JSON.parse(setting.value) as DerpConfig) : derpDefaults;
  const [liveState, debugData] = await Promise.all([fetchLiveDerpState(config), fetchRawDerpMap()]);
  const endpoints = [
    ...(await Promise.all(config.urls.map((url) => probeUrl(url)))),
    ...config.paths.map((path) => ({
      target: path,
      source: "path" as const,
      status: "configured" as const,
      latencyMs: null,
      detail: "Local path configured"
    }))
  ];

  return {
    config,
    liveState: liveState ?? {
      available: false,
      source: "local",
      sourcePath: null,
      embeddedEnabled: config.embeddedEnabled,
      regionId: config.regionId,
      regionCode: config.regionCode,
      regionName: config.regionName,
      nodeCount: 0,
      nodes: []
    },
    debugData,
    summary: summarizeDerp(config),
    endpoints
  };
}

export async function updateDerpConfig(config: DerpConfig) {
  const { instance, setting } = await getSetting("derp");
  const before = setting?.value ? (JSON.parse(setting.value) as DerpConfig) : derpDefaults;
  const after = config;

  await db.systemSetting.upsert({
    where: {
      instanceId_key: {
        instanceId: instance.id,
        key: keys.derp
      }
    },
    create: {
      instanceId: instance.id,
      key: keys.derp,
      value: JSON.stringify(after)
    },
    update: {
      value: JSON.stringify(after)
    }
  });

  const audit = await recordAuditEvent({
    instanceId: instance.id,
    action: "update_derp_config",
    targetType: "derp",
    targetId: instance.id,
    detail: {
      before,
      after,
      beforeSummary: summarizeDerp(before),
      afterSummary: summarizeDerp(after)
    }
  });

  return {
    config: after,
    summary: summarizeDerp(after),
    auditLogId: audit.id
  };
}

export async function listAuditLogs() {
  const instance = await requireActiveInstance();
  const logs = await db.auditLog.findMany({
    where: { instanceId: instance.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
    detail: log.detail ? JSON.parse(log.detail) : null
  }));
}

export async function rollbackConfig(kind: ConfigKind, auditLogId: string) {
  const instance = await requireActiveInstance();
  const log = await db.auditLog.findFirst({
    where: {
      id: auditLogId,
      instanceId: instance.id,
      targetType: kind
    }
  });

  if (!log?.detail) {
    throw new AppError("Rollback entry not found", 404, "ROLLBACK_ENTRY_NOT_FOUND");
  }

  const detail = JSON.parse(log.detail) as { before?: unknown };
  if (detail.before === undefined) {
    throw new AppError("Rollback payload is invalid", 400, "ROLLBACK_PAYLOAD_INVALID");
  }

  switch (kind) {
    case "acl":
      return updateAclConfig(String(detail.before));
    case "dns":
      return updateDnsConfig(detail.before as DnsConfig);
    case "derp":
      return updateDerpConfig(detail.before as DerpConfig);
  }
}
