import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import {
  type HeadscaleApiKey,
  type HeadscaleConfigSummary,
  type HeadscaleNode,
  type HeadscalePreAuthKey,
  type HeadscaleRoute,
  type HeadscaleUser
} from "@/lib/headscale/types";
import { normalizeUrl } from "@/lib/utils";

type ClientOptions = {
  serverUrl: string;
  apiKey: string;
};

type FetchLike = {
  users?: HeadscaleUser[];
  user?: HeadscaleUser;
  nodes?: HeadscaleNode[];
  node?: HeadscaleNode;
  preAuthKeys?: HeadscalePreAuthKey[];
  preAuthKey?: HeadscalePreAuthKey;
  apiKeys?: HeadscaleApiKey[];
  routes?: HeadscaleRoute[];
  version?: string;
  apiKey?: HeadscaleApiKey;
};

export class HeadscaleClient {
  private apiBaseUrl: string;
  private origin: string;
  private apiKey: string;

  constructor({ serverUrl, apiKey }: ClientOptions) {
    this.origin = normalizeUrl(serverUrl);
    this.apiBaseUrl = `${this.origin}/api/v1`;
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, init?: RequestInit, baseUrl = this.apiBaseUrl): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.HEADSCALE_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...(init?.headers ?? {})
        },
        cache: "no-store"
      });

      if (!response.ok) {
        const text = await response.text();
        throw new AppError(text || `Headscale request failed with ${response.status}`, response.status, "HEADSCALE_REQUEST_FAILED");
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("Headscale request timed out", 504, "HEADSCALE_TIMEOUT");
      }
      throw new AppError(error instanceof Error ? error.message : "Unable to connect to Headscale", 502, "HEADSCALE_UNAVAILABLE");
    } finally {
      clearTimeout(timeout);
    }
  }

  async getVersion() {
    const payload = await this.request<{ version?: string }>("/version", undefined, this.origin);
    return payload.version ?? "unknown";
  }

  async validateConnection() {
    await this.listUsers();
    return true;
  }

  async listUsers() {
    const payload = await this.request<FetchLike>("/user");
    return payload.users ?? [];
  }

  async createUser(name: string) {
    const payload = await this.request<FetchLike>("/user", {
      method: "POST",
      body: JSON.stringify({ name })
    });
    return payload.user;
  }

  async renameUser(identifier: string, name: string) {
    const candidates = [
      { path: `/user/${identifier}/rename`, body: { name } },
      { path: `/users/${identifier}/rename`, body: { name } },
      { path: `/user/${identifier}`, body: { name } }
    ];

    for (const candidate of candidates) {
      try {
        const payload = await this.request<FetchLike>(candidate.path, {
          method: "POST",
          body: JSON.stringify(candidate.body)
        });
        return payload.user;
      } catch (error) {
        if (candidate === candidates.at(-1)) throw error;
      }
    }
  }

  async deleteUser(identifier: string) {
    const candidates = [`/user/${identifier}`, `/users/${identifier}`];
    await this.tryDelete(candidates);
  }

  async listNodes() {
    const payload = await this.request<FetchLike>("/node");
    return payload.nodes ?? [];
  }

  async renameNode(nodeId: string, name: string) {
    const candidates = [
      { path: `/node/${nodeId}/rename`, body: { name } },
      { path: `/node/${nodeId}:rename`, body: { name } },
      { path: `/node/${nodeId}`, body: { name } }
    ];

    for (const candidate of candidates) {
      try {
        const payload = await this.request<FetchLike>(candidate.path, {
          method: "POST",
          body: JSON.stringify(candidate.body)
        });
        return payload.node;
      } catch (error) {
        if (candidate === candidates.at(-1)) throw error;
      }
    }
  }

  async deleteNode(nodeId: string) {
    await this.tryDelete([`/node/${nodeId}`, `/nodes/${nodeId}`]);
  }

  async expireNode(nodeId: string) {
    const candidates = [
      `/node/${nodeId}/expire`,
      `/nodes/${nodeId}/expire`,
      `/node/${nodeId}:expire`
    ];

    await this.tryPost(candidates);
  }

  async reassignNode(nodeId: string, user: string) {
    const candidates = [
      { path: `/node/${nodeId}/user`, body: { user } },
      { path: `/node/${nodeId}/move`, body: { user } },
      { path: `/nodes/${nodeId}/user`, body: { user } }
    ];

    for (const candidate of candidates) {
      try {
        const payload = await this.request<FetchLike>(candidate.path, {
          method: "POST",
          body: JSON.stringify(candidate.body)
        });
        return payload.node;
      } catch (error) {
        if (candidate === candidates.at(-1)) throw error;
      }
    }
  }

  async setNodeTags(nodeId: string, tags: string[]) {
    const candidates = [
      { path: `/node/${nodeId}/tags`, body: { tags } },
      { path: `/node/${nodeId}/set-tags`, body: { tags } },
      { path: `/nodes/${nodeId}/tags`, body: { tags } }
    ];

    for (const candidate of candidates) {
      try {
        const payload = await this.request<FetchLike>(candidate.path, {
          method: "POST",
          body: JSON.stringify(candidate.body)
        });
        return payload.node;
      } catch (error) {
        if (candidate === candidates.at(-1)) throw error;
      }
    }
  }

  async registerNode(input: { registrationKey: string; user: string }) {
    const token = encodeURIComponent(input.registrationKey);
    const user = encodeURIComponent(input.user);
    const payload = await this.request<FetchLike>(`/node/register?user=${user}&key=${token}`, {
      method: "POST"
    });
    return payload.node;
  }

  async listPreAuthKeys() {
    const payload = await this.request<FetchLike>("/preauthkey");
    return payload.preAuthKeys ?? [];
  }

  async createPreAuthKey(input: {
    user?: string | number;
    userId?: string | number;
    reusable: boolean;
    ephemeral: boolean;
    expiration?: string;
    aclTags?: string[];
  }) {
    const userValue = input.userId ?? input.user;
    const normalizedUser =
      typeof userValue === "number" ? userValue : typeof userValue === "string" && /^\d+$/.test(userValue) ? Number(userValue) : userValue;

    const candidates = [
      {
        reusable: input.reusable,
        ephemeral: input.ephemeral,
        expiration: input.expiration,
        aclTags: input.aclTags,
        ...(normalizedUser !== undefined ? { user: normalizedUser } : {})
      },
      {
        reusable: input.reusable,
        ephemeral: input.ephemeral,
        expiration: input.expiration,
        aclTags: input.aclTags,
        ...(normalizedUser !== undefined ? { userId: normalizedUser } : {})
      }
    ];

    for (const candidate of candidates) {
      try {
        const payload = await this.request<FetchLike>("/preauthkey", {
          method: "POST",
          body: JSON.stringify(candidate)
        });
        return payload.preAuthKey;
      } catch (error) {
        if (candidate === candidates.at(-1)) throw error;
      }
    }
  }

  async expireOrDeletePreAuthKey(identifier: string, alternateIdentifier?: string) {
    const identifiers = [identifier, alternateIdentifier].filter(Boolean) as string[];
    const deleteCandidates = [...new Set(identifiers.flatMap((value) => [`/preauthkey/${value}`, `/preauthkeys/${value}`]))];
    const expireCandidates = [
      ...new Set(
        identifiers.flatMap((value) => [
          `/preauthkey/${value}/expire`,
          `/preauthkeys/${value}/expire`,
          `/preauthkey/${value}:expire`,
          `/preauthkeys/${value}:expire`
        ])
      )
    ];
    const bodyCandidates = identifiers.flatMap((value) => [
      { path: "/preauthkey/expire", body: { id: value } },
      { path: "/preauthkeys/expire", body: { id: value } },
      { path: "/preauthkey/delete", body: { id: value } },
      { path: "/preauthkeys/delete", body: { id: value } },
      { path: "/preauthkey/expire", body: { key: value } },
      { path: "/preauthkeys/expire", body: { key: value } },
      { path: "/preauthkey/delete", body: { key: value } },
      { path: "/preauthkeys/delete", body: { key: value } }
    ]);

    let lastError: unknown;

    for (const path of deleteCandidates) {
      try {
        await this.request(path, { method: "DELETE" });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    for (const path of expireCandidates) {
      try {
        await this.request(path, { method: "POST" });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    for (const candidate of bodyCandidates) {
      try {
        await this.request(candidate.path, {
          method: "POST",
          body: JSON.stringify(candidate.body)
        });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  async listApiKeys() {
    const payload = await this.request<FetchLike>("/apikey");
    return payload.apiKeys ?? [];
  }

  async createApiKey(expiration?: string) {
    const payload = await this.request<FetchLike>("/apikey", {
      method: "POST",
      body: JSON.stringify({ expiration })
    });
    return payload;
  }

  async expireApiKey(prefix: string) {
    try {
      await this.tryDelete([`/apikey/${prefix}`, `/apikeys/${prefix}`]);
    } catch {
      await this.tryPost([`/apikey/${prefix}/expire`, `/apikeys/${prefix}/expire`]);
    }
  }

  async listRoutes() {
    try {
      const payload = await this.request<FetchLike>("/route");
      return payload.routes ?? [];
    } catch {
      const nodes = await this.listNodes();
      return nodes.flatMap((node) => {
        const available = node.availableRoutes ?? [];
        const approved = new Set(node.approvedRoutes ?? []);
        const primary = new Set(node.primaryRoutes ?? []);

        return available.map((route, index) => ({
          id: `${node.id}-${route}-${index}`,
          nodeId: node.id,
          nodeName: node.givenName || node.name,
          prefix: route,
          advertised: true,
          enabled: approved.has(route),
          isPrimary: primary.has(route)
        }));
      });
    }
  }

  async updateNodeRoutes(nodeId: string, routes: string[]) {
    const candidates = [
      { path: `/node/${nodeId}/approve-routes`, body: { routes } },
      { path: `/node/${nodeId}/routes`, body: { routes } },
      { path: `/nodes/${nodeId}/approve-routes`, body: { routes } }
    ];

    for (const candidate of candidates) {
      try {
        const payload = await this.request<FetchLike>(candidate.path, {
          method: "POST",
          body: JSON.stringify(candidate.body)
        });
        return payload.node;
      } catch (error) {
        if (candidate === candidates.at(-1)) throw error;
      }
    }
  }

  private async tryDelete(paths: string[]) {
    let lastError: unknown;
    for (const path of paths) {
      try {
        await this.request(path, { method: "DELETE" });
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  private async tryPost(paths: string[]) {
    let lastError: unknown;
    for (const path of paths) {
      try {
        await this.request(path, { method: "POST" });
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }
}
