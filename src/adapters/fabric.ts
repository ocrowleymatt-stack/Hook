export type FabricConfig = {
  baseUrl: string;
  projectId: string;
  token?: string;
};

export type FabricRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
};

export function getFabricConfig(): FabricConfig {
  return {
    baseUrl: process.env.FABRIC_BASE_URL || "https://api.fabric.microsoft.com/v1",
    projectId: process.env.FABRIC_PROJECT_ID || "ea671edb-a262-4cef-a95a-5d4842e4161f",
    token: process.env.FABRIC_TOKEN
  };
}

export function fabricConfigured(): boolean {
  const cfg = getFabricConfig();
  return Boolean(cfg.projectId && cfg.token);
}

export async function fabricRequest<T = unknown>(options: FabricRequestOptions): Promise<T> {
  const cfg = getFabricConfig();

  if (!cfg.token) {
    throw new Error("FABRIC_TOKEN is not configured");
  }

  const cleanPath = options.path.startsWith("/") ? options.path : `/${options.path}`;
  const url = `${cfg.baseUrl}/projects/${cfg.projectId}${cleanPath}`;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Authorization": `Bearer ${cfg.token}`,
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(`Fabric API ${res.status}: ${JSON.stringify(data)}`);
  }

  return data as T;
}

export async function fabricHealthCheck() {
  const cfg = getFabricConfig();
  return {
    configured: fabricConfigured(),
    baseUrl: cfg.baseUrl,
    projectId: cfg.projectId,
    tokenPresent: Boolean(cfg.token)
  };
}
