// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "MISTRAL_API_KEY",
    description: "API key for Mistral AI service for Lenormand reading interpretations",
    required: true,
    instructions: "Get your API key from https://console.mistral.ai/api-keys",
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
    name: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    description: "Google Analytics 4 Measurement ID",
    required: true,
    instructions: "Get from Google Analytics dashboard (Admin > Data Streams > Web stream > Measurement ID). Format: G-XXXXXXXXXX",
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
