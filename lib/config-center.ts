export type ConfigKind = "acl" | "dns" | "derp";

export type DnsConfig = {
  magicDns: boolean;
  nameservers: string[];
  splitDns: Array<{ domain: string; nameservers: string[] }>;
  extraRecordsPath: string;
};

export type DerpConfig = {
  embeddedEnabled: boolean;
  verifyClients: boolean;
  regionId: number;
  regionCode: string;
  regionName: string;
  urls: string[];
  paths: string[];
};

export type DerpEndpointStatus = {
  target: string;
  source: "url" | "path";
  status: "configured" | "available" | "unreachable";
  latencyMs: number | null;
  detail: string | null;
};

export type DerpRegionNode = {
  name: string;
  hostName: string;
  regionId: number;
  ipv4: string | null;
  ipv6: string | null;
  stunPort: number | null;
  derpPort: number | null;
};

export type DerpLiveState = {
  available: boolean;
  source: "derpmap" | "local";
  sourcePath?: string | null;
  embeddedEnabled: boolean;
  regionId: number;
  regionCode: string;
  regionName: string;
  nodeCount: number;
  nodes: DerpRegionNode[];
};

export type DerpMapDebugData = {
  available: boolean;
  sourcePath: string | null;
  payload: string | null;
  note: string | null;
};

export type AuditLogEntry = {
  id: string;
  instanceId: string | null;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: unknown;
  createdAt: string | Date;
};

export const aclDefaults = "{\n  \"groups\": {},\n  \"tagOwners\": {},\n  \"acls\": []\n}";

export const dnsDefaults: DnsConfig = {
  magicDns: true,
  nameservers: [],
  splitDns: [],
  extraRecordsPath: ""
};

export const derpDefaults: DerpConfig = {
  embeddedEnabled: false,
  verifyClients: true,
  regionId: 999,
  regionCode: "headscale",
  regionName: "Headscale Embedded DERP",
  urls: [],
  paths: []
};

export function stripJsonComments(input: string) {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/,\s*([}\]])/g, "$1");
}

export function parseAclPolicy(policy: string) {
  const cleaned = stripJsonComments(policy);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const groups = Object.keys((parsed.groups as Record<string, unknown>) ?? {}).length;
  const tagOwners = Object.keys((parsed.tagOwners as Record<string, unknown>) ?? {}).length;
  const acls = Array.isArray(parsed.acls) ? parsed.acls.length : 0;

  return {
    parsed,
    summary: {
      groups,
      tagOwners,
      acls
    }
  };
}

export function summarizeDns(config: DnsConfig) {
  return {
    magicDns: config.magicDns,
    nameservers: config.nameservers.length,
    splitDnsRules: config.splitDns.length,
    extraRecordsPath: config.extraRecordsPath || null
  };
}

export function summarizeDerp(config: DerpConfig) {
  return {
    embeddedEnabled: config.embeddedEnabled,
    verifyClients: config.verifyClients,
    regionId: config.regionId,
    urls: config.urls.length,
    paths: config.paths.length
  };
}

export function parseLineList(input: string) {
  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function stringifyLineList(values: string[]) {
  return values.join("\n");
}

export function parseSplitDnsInput(input: string): DnsConfig["splitDns"] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [domain, rawNameservers = ""] = line.split("=");
      return {
        domain: domain.trim(),
        nameservers: parseLineList(rawNameservers)
      };
    })
    .filter((item) => item.domain);
}

export function stringifySplitDnsInput(splitDns: DnsConfig["splitDns"]) {
  return splitDns.map((item) => `${item.domain}=${item.nameservers.join(", ")}`).join("\n");
}

export function summarizeAuditDetail(detail: unknown) {
  if (!detail || typeof detail !== "object") return null;

  const record = detail as Record<string, unknown>;
  const afterSummary = record.afterSummary;
  if (afterSummary && typeof afterSummary === "object") {
    return Object.entries(afterSummary as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  }

  if (typeof record.nodeName === "string") return record.nodeName;
  if (typeof record.userName === "string") return record.userName;
  if (Array.isArray(record.nodeIds)) return `${record.nodeIds.length} items`;
  if (typeof record.prefix === "string") return record.prefix;
  if (typeof record.targetUser === "string") return record.targetUser;

  return null;
}
