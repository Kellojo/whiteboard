import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import Database from "better-sqlite3";
import {
  genericOidcProviderConfigs,
  oidcProviderSummaries,
} from "./server/oidcProviders";

const database = new Database(".whiteboards/auth.sqlite");

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.ORIGIN,
  "http://localhost:3000",
  "http://localhost:5173",
].filter((origin): origin is string => Boolean(origin));

function resolveBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL || process.env.ORIGIN || "http://localhost:3000"
  );
}

const baseURL = resolveBaseUrl();

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

const secret = resolveAuthSecret();

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

export const auth = betterAuth({
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

export const configuredOidcProviders = oidcProviderSummaries;
