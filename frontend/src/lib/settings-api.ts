export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
}

export interface CompanySettingsResponse {
  success: boolean;
  message: string;
  merchant?: {
    id: string;
    name: string;
    tier: string;
    contactEmail: string;
    businessAddress: string;
  };
}

export interface ApiKeyRegenerateResponse {
  success: boolean;
  message: string;
  apiKey?: string;
  apiKeyMask?: string;
}

export interface WebhookResponse {
  success: boolean;
  webhook?: WebhookConfig;
  message?: string;
}

export interface TeamResponse {
  success: boolean;
  team?: TeamMember[];
  message?: string;
}

export interface StandardResponse {
  success: boolean;
  message: string;
}

export async function updateCompany(
  name: string,
  contactEmail: string,
  businessAddress: string,
  merchantId?: string
): Promise<CompanySettingsResponse> {
  const res = await fetch("/api/settings/company", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, contactEmail, businessAddress, merchantId }),
  });
  return res.json();
}

export async function regenerateApiKey(merchantId?: string): Promise<ApiKeyRegenerateResponse> {
  const res = await fetch("/api/settings/api-key/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantId }),
  });
  return res.json();
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<StandardResponse> {
  const res = await fetch("/api/settings/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.json();
}

export async function fetchTeam(merchantId?: string): Promise<TeamResponse> {
  const query = merchantId ? `?merchantId=${merchantId}` : "";
  const res = await fetch(`/api/settings/team${query}`, { cache: "no-store" });
  return res.json();
}

export async function fetchWebhooks(merchantId?: string): Promise<WebhookResponse> {
  const query = merchantId ? `?merchantId=${merchantId}` : "";
  const res = await fetch(`/api/settings/webhooks${query}`, { cache: "no-store" });
  return res.json();
}

export async function updateWebhooks(
  url: string,
  events: string[],
  merchantId?: string
): Promise<WebhookResponse> {
  const res = await fetch("/api/settings/webhooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, events, merchantId }),
  });
  return res.json();
}
