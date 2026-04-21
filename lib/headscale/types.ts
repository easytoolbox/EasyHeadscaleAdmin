export interface HeadscaleUser {
  id: string;
  name: string;
  displayName?: string | null;
  createdAt?: string | null;
}

export interface HeadscaleNode {
  id: string;
  name: string;
  givenName?: string | null;
  user?: HeadscaleUser | null;
  ipAddresses?: string[];
  forcedTags?: string[];
  invalidTags?: string[];
  validTags?: string[];
  tags?: string[];
  online?: boolean;
  expired?: boolean;
  lastSeen?: string | null;
  expiry?: string | null;
  createdAt?: string | null;
  availableRoutes?: string[];
  approvedRoutes?: string[];
  primaryRoutes?: string[];
  routeCount?: number;
}

export interface HeadscalePreAuthKey {
  id: string;
  key?: string;
  user?: HeadscaleUser | null;
  reusable?: boolean;
  ephemeral?: boolean;
  used?: boolean;
  expiration?: string | null;
  createdAt?: string | null;
  aclTags?: string[];
  expiresSoon?: boolean;
  expired?: boolean;
}

export interface HeadscaleApiKey {
  prefix: string;
  key?: string;
  commandHint?: string;
  expiration?: string | null;
  createdAt?: string | null;
  expiresSoon?: boolean;
}

export interface HeadscaleRoute {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeOnline?: boolean;
  userName?: string;
  prefix: string;
  advertised: boolean;
  enabled: boolean;
  isPrimary: boolean;
}

export interface HeadscaleConfigSummary {
  id: string;
  name: string;
  serverUrl: string;
  description?: string | null;
  lastValidatedAt?: string | null;
  maskedApiKey?: string | null;
  requiresReconnect?: boolean;
}

export interface DashboardHealthSnapshot {
  timestamp: string;
  activeNodes: number;
  expiredNodes: number;
  pendingRoutes: number;
}

export interface GlobalSearchResult {
  users: HeadscaleUser[];
  nodes: HeadscaleNode[];
  routes: HeadscaleRoute[];
  preAuthKeys: HeadscalePreAuthKey[];
  apiKeys: HeadscaleApiKey[];
}
