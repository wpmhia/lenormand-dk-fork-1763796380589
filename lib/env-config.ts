// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "DEEPSEEK_API_KEY",
    description: "API key for DeepSeek AI service for Lenormand reading interpretations",
    required: true,
    instructions: "Get your API key from https://platform.deepseek.com/api-keys",
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    description: "Upstash Redis REST URL for job queue and caching",
    required: true,
    instructions: "Create a Redis database at https://upstash.com and copy the REST URL",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    description: "Upstash Redis REST token for authentication",
    required: true,
    instructions: "From your Upstash Redis dashboard, copy the REST token",
  },
  {
    name: "DEEPSEEK_BASE_URL",
    description: "Base URL for DeepSeek API (optional)",
    required: false,
    instructions: "Only set if using a custom endpoint. Default: https://api.deepseek.com",
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
