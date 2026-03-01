import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  genericOidcProviderConfigs,
  oidcProviderSummaries,
} from "./server/oidcProviders";

function resolveBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL || process.env.ORIGIN || "http://localhost:3000"
  );
}

function resolveAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.npm_lifecycle_event === "build") {
    return "build-only-secret";
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET must be set in production.");
  }

  return "local-dev-secret";
}

function envFlagEnabled(name: string, defaultValue = true): boolean {
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  return !["0", "false", "no", "off"].includes(value.toLowerCase());
}

export const emailPasswordAuthEnabled = envFlagEnabled(
  "AUTH_ENABLE_EMAIL_PASSWORD",
  true,
);

function createAuth() {
  const authDbPath = process.env.AUTH_DB_PATH || ".whiteboards/auth.sqlite";
  mkdirSync(dirname(authDbPath), { recursive: true });

  const database = new Database(authDbPath);
  const secret = resolveAuthSecret();
  const baseURL = resolveBaseUrl();
  const trustedOrigins = [
    process.env.BETTER_AUTH_URL,
    process.env.ORIGIN,
    "http://localhost:3000",
    "http://localhost:5173",
  ].filter((origin): origin is string => Boolean(origin));

  return betterAuth({
    database,
    secret,
    baseURL,
    emailAndPassword: {
      enabled: emailPasswordAuthEnabled,
    },
    trustedOrigins,
    plugins: [
      genericOAuth({
        config: genericOidcProviderConfigs,
      }),
    ],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | null = null;

export function getAuth(): AuthInstance {
  if (authInstance) {
    return authInstance;
  }

  authInstance = createAuth();

  return authInstance;
}

export const configuredOidcProviders = oidcProviderSummaries;
