export interface AppConfig {
  dualConfigured: boolean;
  dualApiUrl: string;
  dualApiToken: string;
  dualOrgId: string;
  dualTemplateId: string;
  dualWebhookSecret: string;
  dualWebhookCallbackUrl: string;
  publicApiUrl: string;
}

export function isDualConfigured(): boolean {
  return process.env.NEXT_PUBLIC_DUAL_CONFIGURED === "true"
    && !!process.env.DUAL_API_TOKEN;
}

export function getConfig(): AppConfig {
  const dualConfigured = isDualConfigured();

  if (dualConfigured) {
    const required = [
      "DUAL_API_TOKEN",
      "DUAL_ORG_ID",
      "DUAL_TEMPLATE_ID",
    ];
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required env var: ${key} (DUAL configured but missing credentials)`);
      }
    }
  }

  return {
    dualConfigured,
    dualApiUrl: process.env.NEXT_PUBLIC_DUAL_API_URL ?? "https://gateway-48587430648.europe-west6.run.app",
    dualApiToken: process.env.DUAL_API_TOKEN ?? "",
    dualOrgId: process.env.DUAL_ORG_ID ?? "",
    dualTemplateId: process.env.DUAL_TEMPLATE_ID ?? "",
    dualWebhookSecret: process.env.DUAL_WEBHOOK_SECRET ?? "",
    dualWebhookCallbackUrl: process.env.DUAL_WEBHOOK_CALLBACK_URL ?? "",
    publicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
  };
}
