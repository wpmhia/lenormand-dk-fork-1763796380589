// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "MISTRAL_API_KEY",
    description: "API key for Mistral AI service for Lenormand reading interpretations",
    required: true,
    instructions: "Get your API key from https://console.mistral.ai/api-keys",
  },
  {
    name: "DATABASE_URL",
    description: "PostgreSQL connection string for Neon database",
    required: true,
    instructions: "Create a project at https://neon.tech and copy the connection string",
  },
  {
    name: "BETTER_AUTH_SECRET",
    description: "Secret key for Better Auth session signing",
    required: true,
    instructions: "Generate with: openssl rand -base64 32",
  },
  {
    name: "NEXT_PUBLIC_BETTER_AUTH_URL",
    description: "Public URL of the app for Better Auth callbacks",
    required: true,
    instructions: "Set to your production domain e.g. https://lenormand.dk",
  },
  {
    name: "GOOGLE_CLIENT_ID",
    description: "Google OAuth client ID for social sign-in",
    required: true,
    instructions: "Create OAuth credentials at https://console.cloud.google.com",
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    description: "Google OAuth client secret",
    required: true,
    instructions: "Found alongside your Google Client ID in Cloud Console",
  },
  {
    name: "RESEND_API_KEY",
    description: "Resend API key for sending password reset emails",
    required: true,
    instructions: "Get your API key from https://resend.com/api-keys",
  },
  {
    name: "EMAIL_FROM",
    description: "From address for transactional emails",
    required: false,
    instructions: "Use onboarding@resend.dev for testing, or your verified domain email",
  },
  {
    name: "NEXT_PUBLIC_SITE_NAME",
    description: "Site name used in emails and UI",
    required: false,
    instructions: "Set to your app name e.g. Lenormand Intelligence",
  },
  {
    name: "NEXT_PUBLIC_BASE_URL",
    description: "Base URL used in email links",
    required: false,
    instructions: "Set to your production domain e.g. https://lenormand.dk",
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    description: "Upstash Redis REST URL for rate limiting (optional)",
    required: false,
    instructions: "Create a Redis database at https://upstash.com for production. Falls back to in-memory if not set.",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    description: "Upstash Redis REST token for authentication (optional)",
    required: false,
    instructions: "From your Upstash Redis dashboard. Falls back to in-memory if not set.",
  },
  {
    name: "MISTRAL_BASE_URL",
    description: "Base URL for Mistral API (optional)",
    required: false,
    instructions: "Only set if using a custom endpoint. Default: https://api.mistral.ai",
  },
  {
    name: "READING_HMAC_SECRET",
    description: "Secret key for signing shared reading URLs (optional)",
    required: false,
    instructions: "Generate a random string. If not set, a default dev key is used (not secure for production)",
  },
];

export interface EnvVariable {
  name: string;
  description: string;
  instructions: string;
  required: boolean;
}

export function checkMissingEnvVars(): string[] {
  return ENV_VARIABLES.filter(
    (envVar) => envVar.required && !process.env[envVar.name],
  ).map((envVar) => envVar.name);
}
