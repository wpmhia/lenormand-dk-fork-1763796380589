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
    description: "PostgreSQL connection string for Neon database (unused in free mode)",
    required: false,
    instructions: "Create a project at https://neon.tech and copy the connection string",
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    description: "Upstash Redis REST URL for reading counter and rate limiting",
    required: false,
    instructions: "Create a Redis database at https://upstash.com for production. Without this, reading counter resets on every deploy.",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    description: "Upstash Redis REST token for authentication",
    required: false,
    instructions: "From your Upstash Redis dashboard. Must be set together with UPSTASH_REDIS_REST_URL.",
  },
  {
    name: "DEFAULT_READING_COUNT",
    description: "Fallback reading counter when Redis is unavailable",
    required: false,
    instructions: "Set to the current accurate count, e.g. 12900. Only used when Redis is not configured.",
  },
  {
    name: "MISTRAL_BASE_URL",
    description: "Base URL for Mistral API (optional)",
    required: false,
    instructions: "Only set if using a custom endpoint. Default: https://api.mistral.ai",
  },
  {
    name: "READING_HMAC_SECRET",
    description: "Secret key for signing shared reading URLs",
    required: true,
    instructions: "Generate a random 32+ character string. Sharing will be disabled if not set.",
  },
  {
    name: "ALLOWED_ORIGIN",
    description: "CORS allowed origin for cross-origin API requests",
    required: false,
    instructions: "Set to your frontend domain for cross-origin API access. Defaults to same-origin only.",
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
