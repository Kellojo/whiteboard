import type { GenericOAuthConfig } from "better-auth/plugins";

interface OidcProviderInput {
  providerId: string;
  name?: string;
  discoveryUrl?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  clientId: string;
  clientSecret?: string;
  issuer?: string;
  scopes?: string[];
  pkce?: boolean;
}

export interface OidcProviderSummary {
  providerId: string;
  name: string;
}

function toProviderSummary(config: OidcProviderInput): OidcProviderSummary {
  return {
    providerId: config.providerId,
    name: config.name?.trim() || config.providerId,
  };
}

function toGenericOAuthConfig(config: OidcProviderInput): GenericOAuthConfig {
  return {
    providerId: config.providerId,
    discoveryUrl: config.discoveryUrl,
    authorizationUrl: config.authorizationUrl,
    tokenUrl: config.tokenUrl,
    userInfoUrl: config.userInfoUrl,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    issuer: config.issuer,
    scopes: config.scopes ?? ["openid", "profile", "email"],
    pkce: config.pkce ?? true,
    mapProfileToUser: (profile) => ({
      name:
        (typeof profile.name === "string" && profile.name) ||
        (typeof profile.preferred_username === "string" &&
          profile.preferred_username) ||
        (typeof profile.email === "string" && profile.email) ||
        "OIDC user",
      email: typeof profile.email === "string" ? profile.email : undefined,
      emailVerified:
        typeof profile.email_verified === "boolean"
          ? profile.email_verified
          : false,
      image: typeof profile.picture === "string" ? profile.picture : undefined,
    }),
  };
}

function parseOidcProvidersFromEnv(): OidcProviderInput[] {
  const raw = process.env.OIDC_PROVIDERS_JSON;
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is OidcProviderInput => {
      if (!entry || typeof entry !== "object") {
        return false;
      }

      const candidate = entry as Partial<OidcProviderInput>;
      return (
        typeof candidate.providerId === "string" &&
        typeof candidate.clientId === "string" &&
        candidate.providerId.trim().length > 0 &&
        candidate.clientId.trim().length > 0
      );
    });
  } catch {
    return [];
  }
}

const parsedProviders = parseOidcProvidersFromEnv();

export const oidcProviderSummaries: OidcProviderSummary[] =
  parsedProviders.map(toProviderSummary);

export const genericOidcProviderConfigs: GenericOAuthConfig[] =
  parsedProviders.map(toGenericOAuthConfig);
